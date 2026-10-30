"""Delivery metrics for storybook.

Reads Jira status history and merged PR type labels, prints cycle times
and the PR type mix, and optionally writes them to two Notion databases.
Standard library only, so the runner needs nothing installed.
"""
import base64
import json
import os
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

JIRA = os.environ["JIRA_BASE_URL"].rstrip("/")
PROJECT = os.environ["JIRA_PROJECT"]
JIRA_AUTH = "Basic " + base64.b64encode(
    f'{os.environ["JIRA_EMAIL"]}:{os.environ["JIRA_API_TOKEN"]}'.encode()
).decode()
GH_TOKEN = os.environ["GH_TOKEN"]
REPO = os.environ["GITHUB_REPOSITORY"]
WRITE = os.environ.get("WRITE_TO_NOTION", "false").lower() == "true"
NOTE = os.environ.get("SNAPSHOT_NOTE", "")
NOTION_TOKEN = os.environ.get("NOTION_TOKEN", "")
TICKETS_DB = os.environ.get("NOTION_TICKETS_DB", "")
SNAPSHOTS_DB = os.environ.get("NOTION_SNAPSHOTS_DB", "")

# Status names in the KAN workflow, compared in lower case.
IDEA, TODO, DONE, CANCELLED = "idea", "to do", "done", "cancelled"
BUG = "bug"   # Jira issue type for defects; bug tickets get their own medians
WORK_TYPES = {"feature", "story", "task"}   # Epics span many tickets, Subtasks double-count their parent
TYPES = ["feature", "bugfix", "maintenance", "test", "docs", "spec", "mixed", "content", "untyped"]
NOW = datetime.now(timezone.utc)


def call(method, url, headers, body=None, tries=3):
    """HTTP call with retries on rate limits and server errors; stops loudly on anything else."""
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(1, tries + 1):
        req = urllib.request.Request(url, data=data, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as err:
            detail = err.read().decode(errors="replace")[:300]
            if err.code in (429, 500, 502, 503, 504) and attempt < tries:
                time.sleep(3 * attempt)
                continue
            sys.exit(f"{method} {url} -> HTTP {err.code}: {detail}")
        except urllib.error.URLError as err:
            if attempt < tries:
                time.sleep(3 * attempt)
                continue
            sys.exit(f"{method} {url} -> {err.reason}")


def jira(path, params):
    url = f"{JIRA}{path}?{urllib.parse.urlencode(params)}"
    return call("GET", url, {"Authorization": JIRA_AUTH, "Accept": "application/json"})


def parse(ts):
    # Jira format: 2026-10-20T14:03:12.345-0400
    return datetime.strptime(ts, "%Y-%m-%dT%H:%M:%S.%f%z")


def jira_issues():
    issues, token = [], None
    while True:
        params = {
            "jql": f"project = {PROJECT} ORDER BY created ASC",
            "fields": "summary,status,issuetype,created",
            "maxResults": 100,
        }
        if token:
            params["nextPageToken"] = token
        page = jira("/rest/api/3/search/jql", params)
        issues += page.get("issues", [])
        token = page.get("nextPageToken")
        if not token:
            return issues


def status_changes(key):
    """Every status move for one ticket, oldest first: (when, from, to)."""
    changes, start = [], 0
    while True:
        page = jira(f"/rest/api/3/issue/{key}/changelog", {"startAt": start, "maxResults": 100})
        values = page.get("values", [])
        for entry in values:
            for item in entry.get("items", []):
                if item.get("field") == "status":
                    changes.append((
                        parse(entry["created"]),
                        (item.get("fromString") or "").lower(),
                        (item.get("toString") or "").lower(),
                    ))
        start += len(values)
        if page.get("isLast", True) or not values:
            return sorted(changes)


def days(a, b):
    return round((b - a).total_seconds() / 86400, 1) if a and b else None


def ticket(issue):
    f = issue["fields"]
    changes = status_changes(issue["key"])
    created = parse(f["created"])
    status = f["status"]["name"]
    initial = changes[0][1] if changes else status.lower()   # status the ticket was created in
    todo_at = next((t for t, _, to in changes if to == TODO), None)            # first To Do
    if todo_at is None and initial == TODO:
        todo_at = created                                    # created straight into To Do (typical for bugs)
    done_moves = [t for t, _, to in changes if to == DONE]
    done_at = done_moves[-1] if done_moves and status.lower() == DONE else None  # last Done, only if still Done
    reopened = sum(1 for _, frm, to in changes if frm == DONE and to != DONE)
    spec_phase = initial == IDEA and todo_at is not None   # status only: created in Idea, then reached To Do
    cancel_moves = [(t, frm) for t, frm, to in changes if to == CANCELLED]
    cancelled_at, cancelled_from = cancel_moves[-1] if cancel_moves and status.lower() == CANCELLED else (None, None)
    return {
        "key": issue["key"], "summary": f.get("summary") or "", "type": f["issuetype"]["name"],
        "status": status, "created": created, "todo_at": todo_at, "done_at": done_at,
        "spec_days": days(created, todo_at) if spec_phase else None,       # no spec time if Idea was skipped
        "delivery_days": days(todo_at, done_at),
        "total_days": days(created, done_at), "reopened": reopened,
        "cancelled_at": cancelled_at, "cancelled_from": cancelled_from,
        "wasted_spec_days": days(created, todo_at) if cancelled_at and spec_phase else None,       # spec finished, then thrown away
        "wasted_delivery_days": days(todo_at, cancelled_at) if cancelled_at else None,             # work after To Do, then thrown away
    }


def merged_prs():
    prs, page = [], 1
    while True:
        batch = call(
            "GET",
            f"https://api.github.com/repos/{REPO}/pulls?state=closed&per_page=100&page={page}",
            {"Authorization": f"Bearer {GH_TOKEN}", "Accept": "application/vnd.github+json"},
        )
        prs += [p for p in batch if p.get("merged_at")]
        if len(batch) < 100:
            return prs
        page += 1


def pr_type(pr):
    tags = [lab["name"][5:] for lab in pr["labels"] if lab["name"].startswith("type:")]
    return tags[0] if len(tags) == 1 and tags[0] in TYPES else "untyped"


def median(values):
    values = [v for v in values if v is not None]
    return round(statistics.median(values), 1) if values else None


# ---------- Notion ----------
def notion(method, path, body):
    return call(method, f"https://api.notion.com/v1/{path}", {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
    }, body)


def p_title(s): return {"title": [{"text": {"content": s}}]}
def p_text(s): return {"rich_text": [{"text": {"content": s[:2000]}}]}
def p_select(s): return {"select": {"name": s}} if s else {"select": None}
def p_num(x): return {"number": x}
def p_date(dt): return {"date": {"start": dt.isoformat()}} if dt else {"date": None}


def upsert_ticket(t):
    props = {
        "Key": p_title(t["key"]), "Summary": p_text(t["summary"]), "Type": p_select(t["type"]),
        "Status": p_select(t["status"]), "Created": p_date(t["created"]),
        "To Do at": p_date(t["todo_at"]), "Done at": p_date(t["done_at"]),
        "Spec days": p_num(t["spec_days"]), "Delivery days": p_num(t["delivery_days"]),
        "Total days": p_num(t["total_days"]), "Reopened": p_num(t["reopened"]),
        "Cancelled at": p_date(t["cancelled_at"]),
        "Synced": p_date(NOW),
    }
    found = notion("POST", f"databases/{TICKETS_DB}/query",
                   {"filter": {"property": "Key", "title": {"equals": t["key"]}}})["results"]
    if found:
        notion("PATCH", f"pages/{found[0]['id']}", {"properties": props})
        return "updated"
    notion("POST", "pages", {"parent": {"database_id": TICKETS_DB}, "properties": props})
    return "created"


def add_snapshot(s, mix):
    label = NOW.date().isoformat() + (f" {NOTE}" if NOTE else "")
    props = {
        "Snapshot": p_title(label), "Date": p_date(NOW),
        "Work tickets done": p_num(s["done"]), "Median spec days": p_num(s["spec"]),
        "Median delivery days": p_num(s["delivery"]), "Median total days": p_num(s["total"]),
        "Bugs done": p_num(s["bugs_done"]), "Median bug delivery days": p_num(s["bug_delivery"]),
        "Median bug total days": p_num(s["bug_total"]),
        "Merged PRs": p_num(sum(mix.values())), "Note": p_text(NOTE),
        "Cancelled tickets": p_num(s["cancelled"]), "Cancelled after spec": p_num(s["cancelled_after_spec"]),
        "Cancelled spec days": p_num(s["wasted_spec"]), "Cancelled delivery days": p_num(s["wasted_delivery"]),
        "Done without To Do": p_num(s["skipped"]),
    }
    for t in TYPES:
        props[f"{t.capitalize()} PRs"] = p_num(mix[t])
    notion("POST", "pages", {"parent": {"database_id": SNAPSHOTS_DB}, "properties": props})


def main():
    tickets = [ticket(i) for i in jira_issues()]
    mix = {t: 0 for t in TYPES}
    for pr in merged_prs():
        mix[pr_type(pr)] += 1

    cancelled = [t for t in tickets if t["cancelled_at"]]
    skipped = [t for t in tickets if t["done_at"] and not t["todo_at"]]   # Idea straight to Done: no stage history
    live = [t for t in tickets if not t["cancelled_at"] and t not in skipped]   # cancelled work is measured as waste, not cycle time
    work = [t for t in live if t["type"].lower() in WORK_TYPES]
    bugs = [t for t in live if t["type"].lower() == BUG]
    excluded = len(live) - len(work) - len(bugs)
    s = {
        "done": sum(1 for t in work if t["done_at"]),
        "spec": median(t["spec_days"] for t in work),
        "delivery": median(t["delivery_days"] for t in work),
        "total": median(t["total_days"] for t in work),
        "bugs_done": sum(1 for t in bugs if t["done_at"]),
        "bug_delivery": median(t["delivery_days"] for t in bugs),
        "bug_total": median(t["total_days"] for t in bugs),
        "skipped": len(skipped),
        "cancelled": len(cancelled),
        "cancelled_after_spec": sum(1 for t in cancelled if t["todo_at"]),
        "wasted_spec": round(sum(t["wasted_spec_days"] or 0 for t in cancelled), 1),
        "wasted_delivery": round(sum(t["wasted_delivery_days"] or 0 for t in cancelled), 1),
    }

    out = ["| Ticket | Type | Status | Spec days | Delivery days | Total days | Reopened |",
           "| --- | --- | --- | --- | --- | --- | --- |"]
    for t in tickets:
        out.append(f'| {t["key"]} | {t["type"]} | {t["status"]} | {t["spec_days"]} | '
                   f'{t["delivery_days"]} | {t["total_days"]} | {t["reopened"]} |')
    out += ["", f'**Work tickets done:** {s["done"]} of {len(work)}. '
                f'**Median days**: spec {s["spec"]}, delivery {s["delivery"]}, total {s["total"]}.',
            "", f'**Bugs done:** {s["bugs_done"]} of {len(bugs)}. '
                f'**Median days**: delivery {s["bug_delivery"]}, total {s["bug_total"]}.',
            "", f"**Left out of the medians:** {excluded} (Epics, Subtasks and any other type).",
            "", f'**Done without going through To Do:** {s["skipped"]} (left out of the medians). '
                + "Tickets: " + (", ".join(t["key"] for t in skipped) or "none") + ".",
            "", f'**Cancelled:** {s["cancelled"]} ({s["cancelled_after_spec"]} after the spec was done). '
                f'**Days spent before cancelling**: spec {s["wasted_spec"]}, delivery {s["wasted_delivery"]}. '
                + "From: " + (", ".join(f'{t["key"]} {t["cancelled_from"]}' for t in cancelled) or "none") + ".",
            "", "**Merged PRs by type:** " + ", ".join(f"{k} {v}" for k, v in mix.items())]
    report = "\n".join(out)
    print(report)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as fh:
            fh.write(report + "\n")

    if not WRITE:
        print("\nDry run: nothing written to Notion.")
        return
    if not (NOTION_TOKEN and TICKETS_DB and SNAPSHOTS_DB):
        sys.exit("WRITE_TO_NOTION is true but a Notion token or database id is missing.")
    for t in tickets:
        print(f'{t["key"]}: {upsert_ticket(t)}')
    add_snapshot(s, mix)
    print(f"Snapshot written: {NOW.date().isoformat()} {NOTE}".rstrip())


if __name__ == "__main__":
    main()

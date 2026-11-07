"""Reorder existing Model C alerts in an offline, equal-capacity experiment."""

import re
import unicodedata


# A cue matches a short, complete statement about possible physical harm.
# Narrow wording keeps e.g. quoted speech and non-human objects out of the rule.
actor = r"(?:i|we|he|she|they|my (?:mom|mum|dad|mother|father|brother|sister|friend|partner)|someone|somebody)"
future = r"(?:would|will|might|may|could|gonna|gotta|(?:have|has|need|needs) to|(?:am|are|is) going to)"
short_future = r"(?:i'll|we'll|he'll|she'll|they'll|i'd|we'd|he'd|she'd|they'd)"
action = r"(?:hit|beat|smack|slap|punch|kick|hurt|kill|shoot|stab|strangle|choke)"
person = r"(?:you|u|him|her|them)"

HARM_STATEMENT = re.compile(
    rf"^(?:bro[, ]+|girl[, ]+)?"
    rf"(?:{actor} (?:genuinely |really )?{future}|{short_future})"
    rf" {action} {person}(?: (?:bro|tonight|tomorrow))?[.! ]*"
    r"(?:[\U0001f300-\U0001faff\ufe0f\u200d]*)$"
)


def cue(comment):
    """Check the same full-comment wording used by the frozen experiment."""
    normalized = unicodedata.normalize("NFKC", comment).casefold().replace("’", "'")
    return HARM_STATEMENT.fullmatch(" ".join(normalized.split())) is not None


def order(rows, cutoff, tie=lambda row: row["id"]):
    """Return the two full orders and the selected priority ID, if eligible.

    Rows contain a unique ID, comment text and a precomputed Model C score.
    Using the same slice of each returned list gives both methods equal capacity.
    """
    original = sorted(rows, key=lambda row: (-row["score"], tie(row)))
    for index, row in enumerate(original):
        if row["score"] < cutoff:
            break  # All later scores are below the alert cutoff as well.
        if cue(row["text"]):
            priority_order = [row, *original[:index], *original[index + 1 :]]
            return original, priority_order, row["id"]
    return original, original, None

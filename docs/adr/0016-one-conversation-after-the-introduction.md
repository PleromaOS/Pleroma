# 16. One growing conversation after the introduction

Date: 2026-10-02

## Status

Accepted

## Context

By 28 September the consultation was a mix of designs: story screens, old
full-screen pages (question tiles, the refine panel, the landing page), and
chat-style steps that each opened a fresh, empty chat. Bryan's rule: the
introduction is told as stories; everything after it happens in the chat.

## Decision

- **Introduction, then one conversation.** Opening the link starts the
  introduction (welcome, how it works, your face your rules, the guarantee,
  getting ready + photo consent). After the camera, everything happens in
  ONE chat thread that keeps growing to the pass or booking link; the client
  can scroll back through all of it. No old full-screen pages remain.
- **Only the most recent reply can be changed** (tap it). No back arrow
  inside the conversation; nothing earlier is taken back, so a spent render
  or a confirmed brief can never be undone by accident.
- **The camera is the one full-screen moment** inside the conversation: it
  needs the whole screen for light and head-turn guidance, and drops the
  three photos into the thread.
- **The question path returns, in the conversation**: no photos, every fact
  asked, the result shown on the style's reference photo (avatars later),
  never guaranteed. Reached from the introduction ("Continue without
  photos", skipping the guarantee and photo-consent screens) or when photos
  can't be read.
- **Changes after the reveal are asked in the conversation**, keeping the
  review-before-spending rule of W29.

## Rejected

- **The same chat look, a fresh page per step** (what existed): cheaper, and
  the locked Reading, Twin and Want screens worked that way, but it reads as
  separate screens rather than one conversation.
- **Changing any earlier reply**: an early change (texture) can invalidate
  everything after it (cut, twin, render).

## Consequences

The locked Reading, Twin and Want screens are rebuilt as parts of one shared
thread (their look and words stay). A long thread holds photos, twins and
renders, so images in older messages must stay light on a phone.

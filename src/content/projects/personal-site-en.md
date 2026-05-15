---
title: Building A Personal Site As A Long-Term Content System
description: A low-maintenance personal content system built with Astro, Markdown, Keystatic, and Cloudflare Pages for sustainable writing and project notes.
date: 2026-05-12
status: active
stack: [Astro, TypeScript, Tailwind CSS, Keystatic, Cloudflare Pages]
links: []
cover: /images/projects/personal-site/media-workflow.svg
media:
  - type: image
    src: /images/projects/personal-site/media-source-options.svg
    alt: No-card media source options for the personal site
    caption: Small media can use public static paths, while hosted media can use full Cloudinary delivery URLs.
  - type: image
    src: https://res.cloudinary.com/dp7apbx6r/image/upload/v1778857386/177_o81hxd.jpg
    alt: Screenshot of an automated mixing system process monitoring interface
    caption: "Cloudinary remote image example: an automated mixing system process monitoring interface."
featured: true
lang: en
translationKey: personal-site
draft: false
---

At first glance this project is just a personal website, but I want it to become a content system that can last.

It is not meant to be a pile of pages or a one-off portfolio. The real goal is to give me a place to keep writing, organize technical notes, record projects, and archive fragments of daily life, with maintenance costs low enough that I will actually keep using it.

## Why Build It

A lot of writing gets washed away by the stream of time. Social platforms are good for immediate expression, but not for long-term organization. Note apps are good for private thinking, but not naturally good for public presentation. Traditional blog systems can spend too much attention on configuration, themes, plugins, and migrations.

This site sits in the middle:

- Content lives in Markdown, so it is easy to move, review, and version.
- Astro generates static pages, which keeps the site fast and deployment simple.
- The editing experience should feel close to normal writing, without requiring a code editor every time.
- Categories, tags, archives, and search reorganize the content instead of leaving it scattered across a timeline.

I want it to feel like a slowly growing workbench. Technical notes, project retrospectives, and life records can all live here, but each type of content has a clear place.

## Project Goals

The project has four core goals.

The first is low maintenance. The site should not require a complex backend, a heavy database, or an oversized admin panel. The content matters most; the stack should serve the writing rather than stealing attention from it.

The second is sustainable writing. Writing a post, changing a description, or updating a project status should be light enough to do often.

The third is discoverability. Once a personal site accumulates content, a homepage timeline is not enough. Search, tags, and archive pages are not decoration; they are the future entry points for finding old work.

The fourth is room to evolve. Today this can be a simple personal site. Later it should be able to support topic pages, English content, project logs, RSS improvements, or a stronger editorial workflow.

## Stack

The current stack has a few main pieces:

- Astro for routing, content collections, and static generation.
- TypeScript for safer content helpers, search indexes, and page data handling.
- Tailwind CSS for styling primitives, with a small global prose layer for reading.
- Markdown and MDX as the main writing format.
- Keystatic as a lightweight content admin experience.
- Cloudflare Pages for hosting and deployment.
- GitHub Actions for checks, type diagnostics, and builds.

The point is not novelty. The point is that the pieces are light together: content stays in the repository, pages are statically generated, deployment is straightforward, and problems are easy to locate.

## Architecture

The site is roughly four layers:

```text
Markdown content
  -> Astro Content Collections
  -> pages, search index, tags, and archive
  -> Cloudflare Pages deployment
```

The content layer contains notes, journal entries, and projects under `src/content`.

The content model layer uses Astro Content Collections to validate frontmatter such as title, description, date, tags, draft state, and project stack.

The presentation and indexing layer turns collections into list pages, detail pages, tag pages, archive pages, and structured search data.

The publishing layer runs checks in pull requests and deploys from the main branch.

The useful part of this architecture is the boundary: writing content means thinking in Markdown; building pages means thinking in components and data flow; publishing is handled by automation.

## Content Model

The site currently has three content types.

`notes` are for technical articles, structured notes, and longer thoughts. Git and Docker guides belong here.

`journal` is for lighter life records. It does not need the same structure as a technical article, but it still has dates, tags, and draft state.

`projects` are closer to case studies. Besides title, description, and date, they track status, stack, and links.

The three types share a few base fields, but they are not forced into one shape. A technical note needs tags and a strong document hierarchy; a project needs status and stack; a journal entry needs more room to breathe.

## Editing Experience

Plain Markdown is enough at the start, but a long-running site benefits from a friendlier editing entry point.

Keystatic plays the role of a lightweight content admin. It does not move content into a database. Instead, it gives an editing UI on top of repository files. That preserves Git history while making routine edits to titles, summaries, tags, and body text easier.

The editing experience should follow a few principles:

- Writing should not require understanding the page implementation.
- Frontmatter fields should be constrained enough to reduce mistakes.
- Drafts can live in the repository without appearing publicly.
- Content changes should still be reviewable through Git diffs.

## Search, Tags, And Archive

When there are only a few posts, a homepage list is enough. As the content grows, the site needs better entry points.

Search answers the question: "I remember writing this, but where did it go?" It covers titles, descriptions, tags, and body text.

Tags gather related material across time. Topics such as Git, Docker, development workflow, and tooling can reconnect posts that were written far apart.

The archive provides a stable time view. It does not recommend; it records. For a personal site, that matters because it lets the content settle into a visible order.

Together, these three surfaces make the site less like a latest-post feed and more like a small reference library.

## Automation And Publishing

The publishing flow is intentionally simple:

```text
local changes
  -> feature branch
  -> pull request
  -> CI checks
  -> merge to main
  -> Cloudflare Pages deployment
```

CI checks tests, Astro diagnostics, and the production build. The purpose is not ceremony; it is to keep basic breakage out of the main branch.

For a personal project, automation also reduces the mental load. If every merge has the same checks, I do not have to rely on memory to know whether I missed something.

## Trade-Offs

I intentionally avoided heavier choices.

There is no database yet, because the current content volume and interaction needs do not require one. Markdown files are easier to back up, migrate, and review.

There is no complex permission system, because this is mostly personal use. Keystatic covers the editing need well enough.

Search is static rather than a backend service, because the site is small and static hosting is a better fit.

The visual style is also not a marketing-style landing page. This site is about reading and organizing, not conversion, so the design should stay quiet, stable, and comfortable for long sessions.

The principle is simple: make the system useful for the long term before adding complex capabilities.

## Next Steps

The next work falls into three areas.

First, reading experience: long technical posts need stronger table of contents, hierarchy, and code block treatment.

Second, content workflow: admin documentation, writing guidelines, tag conventions, and templates can make future writing easier.

Third, project expression: each project should become more than a card. Over time, it should grow into a full case study with goals, architecture, process, trade-offs, results, and next steps.

If this site keeps reducing the friction of recording and presenting work, it will become more than a set of pages. It will become a maintainable personal knowledge space.

# On This Day in Black Detroit History

**Different Years. Same Detroit.**

## What This Application Is

**On This Day in Black Detroit History** is a historical research,
verification, archive, and publishing application built around Black
history that happened in Detroit, Michigan.

It provides a public-facing historical archive and a private
administrative system for researching, reviewing, preparing, publishing,
and preserving historical records.

The goal is to create a reliable long-term database of Detroit Black
history that powers the project's daily **On This Day** content and
Instagram presence.

## What the Application Is For

The application is designed to:

-   Build and maintain a structured database of Black history connected
    to Detroit.
-   Organize historical events by month, day, and year.
-   Collect historical research leads.
-   Verify historical information before publication.
-   Preserve source and research information.
-   Identify what happened on a specific date in Detroit history.
-   Prepare approved historical events for Instagram.
-   Publish approved content directly to Instagram.
-   Keep a permanent record of historical events that have already been
    published.
-   Prevent previously used records from being accidentally deleted or
    unknowingly reused.

The application is intended to be the **database and operating system
behind the Instagram archive**, rather than simply a website that
displays posts.

# How the System Works

Every historical record moves through a controlled lifecycle:

``` text
RESEARCH
   ↓
NEEDS REVIEW
   ↓
APPROVED
   ↓
INSTAGRAM QUEUE
   ↓
PUBLISHED
   ↓
USED HISTORY
```

There are three related status systems.

## Verification Status

``` text
draft
needs_review
approved
rejected
```

### Draft

A record is being developed or has not entered formal review.

### Needs Review

A historical lead has been entered and needs research and verification.

### Approved

The record has passed verification and can enter the Instagram workflow.

### Rejected

The record should not be published in its current form. It remains in
the database for recordkeeping.

## Archive Status

``` text
active
instagram
used
```

### Active

The record is part of the historical archive but has not entered the
Instagram queue.

### Instagram

The record has been approved and moved into the Instagram publishing
queue.

### Used

The record has been published and remains in the permanent used-history
archive.

**Used records are not deleted.**

## Instagram Status

``` text
not_ready
queued
scheduled
published
failed
```

# Daily Workflow

## 1. Research

Use **Research Intake** to add a historical lead.

Include as much information as available:

-   Date
-   Historical event title
-   Description
-   Significance
-   Category
-   People
-   Organizations
-   Detroit location
-   Sources
-   Research notes

New intake records automatically enter:

``` text
Verification: needs_review
Archive: active
Instagram: not_ready
```

Entering a record does not make it publishable.

## 2. Quality Control

Go to **Quality Control**.

Use it to identify:

-   Records awaiting review
-   Missing sources
-   Missing descriptions
-   Missing significance
-   Missing categories
-   Duplicate dates
-   Duplicate titles
-   Incomplete approved records
-   Rejected records

Historical records should be reviewed before approval.

## 3. Approve or Reject

Records in **Needs Review** can be approved or rejected.

Approved:

``` text
verification.status = approved
```

Rejected:

``` text
verification.status = rejected
```

Rejected records remain in the database.

# 4. On This Day

The **On This Day** admin page shows historical events for a selected
month and day.

For example:

``` text
September 23

1971
Event A

1975
Event B

1984
Event C
```

Only records with:

``` text
verification.status = approved
archive.status = active
```

are displayed as ready for the public On This Day experience.

## 5. Prepare Instagram Content

Approved active records can be moved into the **Instagram Queue**.

The normal transition is:

``` text
Approved + Active
        ↓
Instagram Queue
```

The Instagram workflow includes:

-   Caption
-   Image
-   Image credit
-   Image rights information
-   Scheduling information

## 6. Publish to Instagram

Before publishing, a record should have:

-   Approved verification status
-   Instagram archive status
-   A saved caption
-   At least one usable image

The publishing process is:

``` text
Create media container
        ↓
Wait for media processing
        ↓
Confirm media is ready
        ↓
Publish media
        ↓
Save Instagram post ID
        ↓
Move record to Used History
```

After successful publication:

``` text
Archive: used
Instagram: published
```

The publication timestamp and Instagram post ID are saved.

## 7. Used History

**Used History** is the permanent record of content that has already
been published.

It preserves:

-   Historical date
-   Event title
-   Description
-   Category
-   Instagram caption
-   Images
-   Sources
-   Publication date
-   Instagram post ID

This creates a publishing ledger and helps prevent accidental
duplication.

# Public Website

The public homepage displays approved historical records for the current
Detroit date.

The public experience is intentionally simple:

``` text
On This Day in Black Detroit History

Different Years. Same Detroit.

[Today's date]

[Historical events for today's date]
```

If no approved active records exist for the current date, the site
displays a **Research Needed** message.

The public site does not expose the administrative research workflow.

# Private Administration

The administrative system is protected by login authentication.

Main admin areas:

``` text
/admin
/admin/today
/admin/intake
/admin/quality
/admin/instagram
/admin/used
```

Administrative API routes are also protected.

# Main Admin Pages

## History Archive

``` text
/admin
```

Central archive for managing historical records.

Use it to:

-   Search and filter records
-   View archive status
-   Review verification status
-   Move records through the archive lifecycle
-   View source information
-   Manage Instagram workflow status

## On This Day

``` text
/admin/today
```

Use it to:

-   Select a month and day
-   View approved historical events
-   Prepare individual records for Instagram
-   Prepare multiple records for Instagram

## Research Intake

``` text
/admin/intake
```

Use it to add new historical leads.

New records enter the review process automatically.

## Quality Control

``` text
/admin/quality
```

Use it to:

-   Review new historical leads
-   Approve records
-   Reject records
-   Identify incomplete records
-   Find duplicate records
-   Check source completeness

## Instagram Queue

``` text
/admin/instagram
```

Use it to:

-   Select records ready for Instagram
-   Edit captions
-   Add and manage images
-   Save post information
-   Schedule posts
-   Publish to Instagram
-   Send records back to the active archive

## Used History

``` text
/admin/used
```

Use it to review records that have already been published.

Used records remain part of the permanent database.

# Historical Research Standards

Before approving a record:

1.  Confirm the date.
2.  Confirm the event occurred in Detroit or has a direct Detroit
    connection.
3.  Confirm associated people and organizations.
4.  Confirm the historical description.
5.  Confirm the significance.
6.  Check primary or reputable secondary sources when available.
7.  Record supporting sources.
8.  Resolve conflicting information when possible.
9.  Keep research notes when additional verification is needed.
10. Approve only when the record is sufficiently supported for
    publication.

When information cannot yet be verified, keep the record in:

``` text
needs_review
```

rather than treating an unverified lead as established history.

# Database

The application uses **MongoDB** with Mongoose.

Historical records contain structured information including:

``` text
Date
Title
Description
Significance
Category
People
Organizations
Location
Sources
Images
Verification
Archive
Instagram
Created/Updated timestamps
```

This allows the database to support:

-   Historical research
-   Public website
-   Daily On This Day content
-   Instagram publishing
-   Archive management
-   Publishing history
-   Future search and discovery features

# Categories

Records can be organized into:

-   Civil Rights
-   Music
-   Business
-   Education
-   Politics
-   Sports
-   Arts & Culture
-   Labor
-   Community
-   Military
-   Media
-   Other

# Images

Historical records can contain:

-   Image URL
-   Credit
-   Rights information

Images used for Instagram publishing must be publicly accessible to the
Instagram publishing system.

Image rights and attribution should be checked before publication.

# Environment Variables

Example:

``` env
MONGODB_URI=your_mongodb_connection_string

ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password

INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_ACCOUNT_ID=your_instagram_account_id
INSTAGRAM_API_VERSION=v26.0
```

**Never commit real credentials or access tokens to Git.**

Keep the `.env` file private.

# Local Development

Install dependencies:

``` bash
npm install
```

Start development:

``` bash
npm run dev
```

The application is normally available at:

``` text
http://localhost:3000
```

Build:

``` bash
npm run build
```

Start production:

``` bash
npm start
```

# Recommended Operating Routine

``` text
1. Research historical leads
          ↓
2. Enter leads through Research Intake
          ↓
3. Run Quality Control
          ↓
4. Verify records
          ↓
5. Approve accurate records
          ↓
6. Check On This Day
          ↓
7. Move approved records to Instagram
          ↓
8. Prepare caption and image
          ↓
9. Publish
          ↓
10. Confirm Instagram publication
          ↓
11. Record remains in Used History
```

# Important Rules

### Do not delete published history

Published records belong in **Used History**.

### Do not publish unverified history

Only approved records should enter the Instagram workflow.

### Keep sources

Historical claims should retain their supporting sources.

### Preserve research leads

Records needing additional research should remain available for later
verification.

### Keep publishing history

Once a record has been published, its publication information should
remain attached to the historical record.

# Project Philosophy

The project is built around one simple idea:

> Black history is Detroit history.

The Instagram account is the public-facing expression of the project.

The database is the foundation.

The long-term objective is to build a durable, searchable, continually
growing archive of Black history connected to Detroit --- organized by
date and preserved across generations.

**Different Years. Same Detroit.**

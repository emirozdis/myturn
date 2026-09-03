# MyTurn

MyTurn is a shared video diary: friends take turns recording daily vlogs, react to each other's clips, and revisit their group's stories and weekly highlights.

This private repository brings the complete project together using **Git submodules**. Each component is an independent repository with its own commits, branches, issues, and releases. The parent records the exact component versions that belong together.

## Repositories

| Local folder | GitHub repository | Purpose |
| --- | --- | --- |
| `myturn/` | [myturn-backend](https://github.com/emirozdis/myturn-backend) | Next.js API, admin dashboard, legal pages, database migrations, and media delivery worker |
| `myturn-app/` | [myturn-app](https://github.com/emirozdis/myturn-app) | Expo / React Native mobile app and widgets |
| `myturn-cron-worker/` | [myturn-cron-worker](https://github.com/emirozdis/myturn-cron-worker) | Cloudflare trigger for the durable backend scheduler |
| `supervisor/` | [myturn-supervisor](https://github.com/emirozdis/myturn-supervisor) | Vast.ai GPU fleet and transcoding mission orchestration |
| `transcoder/` | [ffmpeg-api](https://github.com/emirozdis/ffmpeg-api) | FFmpeg media processing worker; existing repository and history retained |
| `myturn-wrapped-remotion/` | [myturn-wrapped-remotion](https://github.com/emirozdis/myturn-wrapped-remotion) | Weekly Wrapped video compositions and example assets |
| `wrapped-scene-storyboard/` | [myturn-wrapped-storyboard](https://github.com/emirozdis/myturn-wrapped-storyboard) | Visual references for the ten Wrapped scenes |

The parent contains shared documentation and runbooks. The backend's `cloudflare-worker/` remains part of the backend repository.

## Clone the complete project

Your GitHub account needs access to the private repositories and a configured SSH key.

```sh
git clone --recurse-submodules git@github.com:emirozdis/myturn.git myturn-package
cd myturn-package
```

If you already cloned without submodules:

```sh
git submodule update --init --recursive
```

Install and run each service from its own folder using its README. There is no shared root install command. Start with the backend and mobile app; the supervisor and transcoder support media processing, and the cron worker triggers scheduled work. Wrapped and the storyboard can be worked on independently.

## Work on a component

Submodule checkouts normally start at a pinned commit. Switch to a branch before making changes:

```sh
cd myturn-app
git switch main
git pull --ff-only origin main
# Make changes, then review and commit them.
git add <changed-files>
git commit -m "Describe the app change"
git push origin main
cd ..

# Record the new app version in the parent repository.
git add myturn-app
git commit -m "Update mobile app version"
git push origin main
```

Push component commits first, then the parent. The parent is configured locally to check that referenced component commits have been pushed (`push.recurseSubmodules=check`). After a fresh clone, enable that check with `git config push.recurseSubmodules check`.

## Get project updates

With local changes committed or stashed:

```sh
git pull --ff-only origin main
git submodule update --init --recursive
```

This checks out the versions recorded by the parent. To deliberately advance one component to its latest `main`, use `git submodule update --remote myturn-app`, review the changes, and commit the updated reference in the parent. Check all component versions with `git submodule status`.

## Configuration and deployment

Each service owns its environment configuration, dependency lockfile, and deployment process. Copy its example environment file and obtain the real values through the team's private configuration channels. Local environment files, native Firebase configuration, signing files, database backups, dependency directories, and generated outputs are excluded from source control.

Pushing this parent does not itself deploy every component. Existing hosting integrations attached to a component repository can still react to pushes to that component.

- [Transcoder migration guide](TRANSCODER_MIGRATION_GUIDE.md)
- [Transcoder performance queries](transcoder-performance-report.sql)
- [Backend setup](https://github.com/emirozdis/myturn-backend/blob/main/README.md)
- [Mobile setup](https://github.com/emirozdis/myturn-app/blob/main/README.md)
- [Supervisor setup](https://github.com/emirozdis/myturn-supervisor/blob/main/README.md)
- [Transcoder setup](https://github.com/emirozdis/ffmpeg-api/blob/main/README.md)

All repositories are private. No open-source license is granted by this repository.

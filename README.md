# tonari blog

This is tonari's blog, run with next.js and backed by Notion via their API. Articles are written in the form of pages
in a Notion database, and this codebase then fetches and coverts those pages into static content that is
deployed to a Firebase static site.

The code here is an unbranded version of our blog, but is not a turn-key solution for a new blog. There's a lot of
hardcoded stuff in here (like the Japanese-English language support and GoatCounter metrics) that you'll need
to modify to your own needs. We hope it serves as a good starting-point for others, though, and would also be
welcome to the idea of others turning it into a more generic configurable blog system.

# Getting started

## 1. Duplicate the sample database

* Go to [the same database Notion page](https://jakebot.notion.site/jakebot/Blog-Example-92b8d335abda424eb5baf96e4a5208a4) and click "Duplicate" on the top right, copying it into your workspace.
* In your duplicated page, get your new database's ID by hovering over the database title ("Posts"), clicking on "..." -> "Open as page".

    The new URL will look like `https://www.notion.so/yourname/[DATABASE_ID]?v=[VIEW_ID]`.

    Copy *just* the `DATABASE_ID` and place it in the `databaseId` field in `blog.config.js`.

## 2. Create a new API "integration"

* Go to [My Integrations](https://www.notion.so/my-integrations) on Notion and make a new internal integration.
* Make a new `.env` file with your integration key:
    ```bash
    NOTION_API_KEY=[secret_YOURAPIKEY]
    ```

## 3. Setup dev environment

Install [yarn](https://yarnpkg.com/) if you don't have it already, then within the root of this repository, run:
```
yarn
```
to grab all dependencies.

### Running Locally

```
yarn dev
```

And then visit http://localhost:3000/

### Building for production

To export a static site to the `out/` directory:
```
yarn export:prod
```

We included some sample scripts in `package.json` and a `firebase.json` for deploying to Firebase, which is what we use for tonari's blog, but you're obviously free to deploy that static site anywhere you want.

### Firebase deployment helpers

We deploy our blog to staging and production using a Slack slash command that triggers a GitHub Action which builds & deploys the site to Firebase Hosting. It was the simplest way to allow non-technical peeps to update the blog and not need a server running.

Thus, included in this blog is also an optional GitHub action and Firebase function you can modify and deploy to use this functionality yourself if you'd like.

To deploy the functions:
```
yarn deploy:functions
```

See this blog for more details on setting it up (thanks to whoever wrote this, by the way): https://whatdafox.com/trigger-github-workflow-from-slack-using-firebase-functions/.

## Credits

This was originally a fork of https://github.com/ijjk/notion-blog, but has since been largely re-written.

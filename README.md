# event-collector

Database and functions to collect events' information
(Now it's under development...)

## How to setup

```bash
npm install
```

## How to deploy

```bash
npx serverless deploy -v
```

## How to remove deployed services

```bash
npx serverless remove
```

## How to work

These functions collect events of specified month in event as following.

```json
{
    params: {
        year: 2021,
        month: 4
    }
}
```

Collected events are going to be pushed to database.

# event-collector

Database and functions to collect events' information

!You need to get a API Key of Doorkeeper and set it serverless.yml, if you want to collect its events.

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
    "year": 2021,
    "month": 4
}
```

You can specify target period with API Gateway.

```bash
curl -X POST -H "Content-Type: application/json" -d '{"year": 2021, "month": 3}' [Deployed API Endpoint]
```

!Collecting events can be aborted due to timeout limitation of API Gateway.

Collected events are going to be pushed to database.

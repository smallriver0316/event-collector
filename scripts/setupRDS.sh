#!/bin/sh -v

if [ $# -ne 2 ]; then
    echo "setupRDS.sh [ARN of database] [ARN of SecretsManager]"
    exit 1
fi

DB_ARN=$1
SECRET_ARN=$2

# Attention!: PostgreSQL does not support if not exists in create database
aws rds-data execute-statement --resource-arn $DB_ARN --secret-arn $SECRET_ARN \
--sql "create database event_collector_db"

aws rds-data execute-statement --resource-arn $DB_ARN --secret-arn $SECRET_ARN --database "event_collector_db" \
--sql 'create table if not exists "event_table" (id varchar(40) PRIMARY KEY, origin varchar(20), event_id varchar(20), title text DEFAULT null, description text DEFAULT null, event_url text DEFAULT null, start_time varchar(40) DEFAULT null, end_time varchar(40) DEFAULT null, ticket_limit int DEFAULT null, accepted int DEFAULT null, waiting int DEFAULT null, updated_at varchar(40) DEFAULT null, place text DEFAULT null, address text DEFAULT null, lat double precision DEFAULT null, lon double precision DEFAULT null)'

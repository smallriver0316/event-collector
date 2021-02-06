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
--sql 'create table if not exists "event_table" (id varchar(20) PRIMARY KEY, origin varchar(10), event_id varchar(10), title varchar(20), description text, event_url text, start_time varchar(20), end_time varchar(20), ticket_limit int, accepted int, waiting int, updated_at varchar(20), place varchar(64), address varchar(64), lat double precision, lon double precision)'

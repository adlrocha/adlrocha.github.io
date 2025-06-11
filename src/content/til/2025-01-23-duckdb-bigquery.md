---
title: "Querying BigQuery public datasets from DuckDB"
date: "2025-01-23"
draft: false
tags: ["data", "duckdb", "bigquery", "sql"]
---

# Querying BigQuery public datasets from DuckDB

```
FORCE INSTALL 'bigquery' FROM community;
LOAD 'bigquery';

SELECT * FROM duckdb_extensions();

ATTACH 'project=test-project-444413' AS bq (TYPE bigquery);

SELECT * FROM bigquery_execute('bq', 'SELECT * FROM bigquery-public-data.bitcoin_blockchain.blocks LIMIT 1');
```

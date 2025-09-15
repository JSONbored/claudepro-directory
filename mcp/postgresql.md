# PostgreSQL MCP Server

Connect Claude to PostgreSQL databases for data analysis, queries, and schema management.

## Features

- Execute SQL queries and get results
- Inspect database schemas and table structures
- Analyze data relationships and constraints
- Generate reports and insights from your data
- Safe read-only operations by default

## Installation

```bash
npx -y @modelcontextprotocol/server-postgresql postgresql://username:password@localhost:5432/database
```

## Configuration

Add to your Claude desktop app configuration:

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgresql",
        "postgresql://username:password@localhost:5432/database"
      ]
    }
  }
}
```

## Connection String Format

```
postgresql://[username[:password]@][host][:port][/database]
```

### Examples

**Local development:**
```
postgresql://myuser:mypass@localhost:5432/mydatabase
```

**Production with SSL:**
```
postgresql://user:pass@prod-host:5432/db?sslmode=require
```

**Cloud providers:**
```
postgresql://user:pass@aws-rds-endpoint:5432/database
postgresql://user:pass@cloud-sql-proxy:5432/database
```

## Available Tools

### Query Execution
- Execute SELECT statements
- Run analytical queries
- Get query results in structured format

### Schema Inspection
- List all tables and views
- Describe table structures
- View constraints and indexes
- Analyze relationships

### Data Analysis
- Count records
- Calculate aggregations
- Find data patterns
- Generate summaries

## Security

- Read-only access by default
- Connection string encryption
- SSL/TLS support
- Network security best practices

## Common Use Cases

1. **Data Analysis**: Query your database to understand trends and patterns
2. **Schema Documentation**: Generate documentation for database structures
3. **Data Validation**: Check data quality and consistency
4. **Reporting**: Create custom reports from database queries
5. **Troubleshooting**: Investigate data issues and anomalies

## Example Queries

**Analyze user activity:**
```sql
SELECT DATE(created_at) as date, COUNT(*) as new_users
FROM users 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

**Find table relationships:**
```sql
SELECT 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

Perfect for data analysts, developers, and anyone who needs to interact with PostgreSQL databases through Claude.
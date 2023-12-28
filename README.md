# ETL de Migración de LXP hacia Voldemort

## Objetivo

Este ETL tiene como objetivo concentrar toda la funcionalidad para migrar la información de los clientes de Lapzo, de la plataforma LXP hacia Voldemort. Esto incluye información de la empresa, OUs, roles, usuarios, cursos propios, kardex de los usuarios (cursos a los que están inscritos y su avance actual), cursos de marketplace, learning paths, etc.

Es imperativo que todas las pruebas se realicen estrictamente en un ambiente local basado en Docker, por lo que se debe utilizar un respaldo proporcionado por Alfredo Vázquez. También se debe contar con el CLI de postgres **psql** para poder ejecutar la importación de los datos

## Crear bases de datos locales utilizando Docker

Se debe contar con Docker y Docker Desktop instalados, y proceder a crear las 3 bases de datos que se requerirán para realizar pruebas locales:

### Instancia de base de datos local para Voldemort

**1. Crear contenedor Docker**

```
docker run --name voldemort-local -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:13.6-alpine
```

**2. Descargar y descomprimir dump de respaldo**

```
https://storage.googleapis.com/bk-general/Backup_DBs/Lapzo-Voldemort-Prod-2023-12-26.sql.zip
```

**3. Carga del dump a la DB en el contenedor**

```
<RUTA_A_PSQL>/psql -h localhost -p 5432 -U postgres -f Lapzo-Voldemort-Prod-2023-12-26.sql postgres
```

---

**Instancia de base de datos local para LMS**

**1. Crear contenedor Docker**

```
docker run --name lapzo-lms-local -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5433:5432 -d postgres:13.6-alpine
```

**2. Descargar y descomprimir dump de respaldo**

```
https://storage.googleapis.com/bk-general/Backup_DBs/Lapzo-LMS-Prod-2023-12-26.sql.zip
```

**3. Carga del dump a la DB en el contenedor**

```
<RUTA_A_PSQL>/psql -h localhost -p 5433 -U postgres -f Lapzo-LMS-Prod-2023-12-26.sql postgres
```

---

**Instancia de base de datos local para LXP**

**1. Crear contenedor Docker**

```
docker run --name lxp-local -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5434:5432 -d postgres:13.6-alpine
```

**2. Descargar y descomprimir dump de respaldo**

```
https://storage.googleapis.com/bk-general/Backup_DBs/Lapzo-LXP-Prod-2023-12-26.sql.zip
```

**3. Carga del dump a la DB en el contenedor**

```
<RUTA_A_PSQL>/psql -h localhost -p 5433 -U postgres -f Lapzo-LXP-Prod-2023-12-26.sql postgres
```

## Ejecutar el ETL

1. Primero que nada se debe abrir el archivo **src/server-etl.ts** y asegurarse de establecer la variable:

```
serverGlobals.transformClient = '<SUBDOMINIO_CLIENTE>';
```

2. Asegurarse de que estén descomentados los scripts a ejecutar, por ejemplo:

```
await startCoursesPipeline();
await startModulesPipeline();
await startCourseLessonsPipeline();
await startCourseLessonsQuestionsPipeline();
await startCourseLessonsResourcesPipeline();
```

3. Ejecutar el script utilizando este comando

```
npm run start
```

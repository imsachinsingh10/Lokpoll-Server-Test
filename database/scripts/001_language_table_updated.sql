insert into db_logs (`dev`, scriptName) values ('himanshu', '002_language_table_updated.sql');

alter table language add column translation varchar(50);

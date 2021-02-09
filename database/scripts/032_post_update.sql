insert into db_logs (`dev`, scriptName) values ('himanshu', '032_post_update.sql');

alter table post add column isGeneric TINYINT(4);

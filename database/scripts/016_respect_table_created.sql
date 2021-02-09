insert into db_logs (`dev`, scriptName) values ('himanshu', '016_respect_table_created.sql');

drop table if exists respect;
create table if not exists respect (
	id bigint primary key auto_increment,
    respectFor bigint,
    respectBy bigint,
    createdAt datetime
);

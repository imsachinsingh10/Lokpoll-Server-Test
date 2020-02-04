insert into db_logs (`dev`, scriptName) values ('himanshu', '015_deviceToken_added_in_user.sql');

alter table user add column deviceToken varchar(5000);

alter table post change latitude latitude double default null, change longitude longitude double default null;

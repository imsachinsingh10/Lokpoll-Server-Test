insert into db_logs (`dev`, scriptName) values ('himanshu', '006_otp_column_updated.sql');

ALTER TABLE `verification`
CHANGE COLUMN `otp` `otp` VARCHAR(20) NULL DEFAULT NULL ;

alter table user change column workingStatus workingStatus varchar(40) default null;

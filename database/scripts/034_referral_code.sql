insert into db_logs (`dev`, scriptName) values ('himanshu', '034_referral_code.sql');

alter table user
add column referralCode varchar(16) default null,
add column parentId bigint(20) default 0,
add column gParentId bigint(20) default 0;

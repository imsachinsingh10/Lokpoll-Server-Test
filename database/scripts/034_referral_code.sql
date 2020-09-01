insert into db_logs (`dev`, scriptName) values ('himanshu', '034_referral_code.sql');

alter table user
add column referralCode varchar(16) default null,
add column parentReferralCode varchar(16) default null,
add column gParentReferralCode varchar(16) default null;

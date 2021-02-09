insert into db_logs (`dev`, scriptName) values ('himanshu', '031_schedular.sql');

ALTER TABLE `post`
ADD COLUMN `publishDate` DATETIME NULL;

ALTER TABLE `post`
ADD COLUMN `isPublished` TINYINT(4) NULL AFTER `publishDate`;

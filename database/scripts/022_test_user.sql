insert into db_logs (`dev`, scriptName) values ('himanshu', '021_mood_table_updated.sql');

alter table user add column isTestUser tinyint(4) default 0;
DROP TABLE IF EXISTS `location`;
CREATE TABLE `location` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `address` varchar(500),
  PRIMARY KEY (`id`)
);

alter table user add column appLanguage varchar(100) null;
alter table user add column contentLanguage varchar(100) null;

drop table if exists post_view;
create table post_view (
	id bigint primary key auto_increment,
    userId bigint,
    postId bigint,
    seenDate datetime
)

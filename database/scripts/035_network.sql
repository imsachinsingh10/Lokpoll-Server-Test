insert into db_logs (`dev`, scriptName) values ('himanshu', '035_network.sql');

alter table user add column level bigint default 0;

-- -----------------------------------------------------
-- Table `coin_activity`
-- -----------------------------------------------------
drop table if exists coin_activity;
create table coin_activity (
    id bigint auto_increment primary key,
    activity varchar(50),
    description varchar(500),
    coins mediumint,
    updatedOn datetime
)

-- -----------------------------------------------------
-- Table `coin_activity_log`
-- -----------------------------------------------------
drop table if exists coin_activity_log;
create table coin_activity_log (
  id bigint primary key auto_increment,
  activity varchar(40),
  coins mediumint unsigned,
  userId bigint references `user`(`id`),
  postId bigint references `post`(`id`),
  contestPostId bigint references `post`(`id`),
  logTime datetime
);

alter table user add column coins bigint default 0;

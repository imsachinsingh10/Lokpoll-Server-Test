insert into db_logs (`dev`, scriptName) values ('himanshu', '036_polls.sql');

-- -----------------------------------------------------
-- Table `coin_activity`
-- -----------------------------------------------------
drop table if exists coin_activity;
create table coin_activity (
    activity varchar(50) primary key,
    description varchar(500),
    coins mediumint,
    updatedOn datetime
);

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

-- -----------------------------------------------------
-- Table `user_app_access`
-- -----------------------------------------------------
drop table if exists user_app_access;
create table user_app_access (
    id bigint(20) auto_increment primary key,
    userId bigint(20),
    activity varchar(30),
    logDate datetime
);

-- -----------------------------------------------------
-- Table `poll`
-- -----------------------------------------------------
drop table if exists poll;
create table poll (
      id bigint(20) primary key auto_increment,
      postId bigint(20),
      question text,
      option1 text,
      option2 text,
      option3 text,
      option4 text,
      option5 text,
      foreign key (postId) references `post`(`id`) on DELETE cascade
);
alter table poll add column expiryDate datetime;
-- -----------------------------------------------------
-- Table `poll_answer`
-- -----------------------------------------------------
drop table if exists poll_answer;
create table poll_answer (
     id bigint(20) primary key auto_increment,
     userId bigint(20),
     pollId bigint(20),
     answer text,
     answerNumber tinyint,
     foreign key (pollId) references `poll`(`id`) on DELETE cascade,
     foreign key (userId) references user(id) on delete cascade,
     UNIQUE KEY(userId, pollId)
);

alter table post add column descriptionOld longtext default null;
alter table post add column postIdParent bigint(20);
alter table post add column link mediumtext default null;
alter table post add column contentType varchar(50) default null;
alter table post add column text longtext default null;
alter table post add column textColor varchar(16) default null;
alter table post add column textBgColor varchar(16) default null;

alter table coin_activity add column position int default 0;
alter table coin_activity add column name varchar default null;
alter table coin_activity add column group varchar default null;

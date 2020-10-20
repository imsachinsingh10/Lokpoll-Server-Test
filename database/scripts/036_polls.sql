insert into db_logs (`dev`, scriptName) values ('himanshu', '036_polls.sql');

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

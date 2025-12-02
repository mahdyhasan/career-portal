-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Dec 02, 2025 at 03:37 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `augmex_career`
--

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `id` int NOT NULL,
  `job_id` int NOT NULL,
  `candidate_user_id` int NOT NULL,
  `status_id` int NOT NULL,
  `source` enum('Direct','Linkedin','Facebook','Referral') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `application_answers`
--

CREATE TABLE `application_answers` (
  `id` int NOT NULL,
  `application_id` int NOT NULL,
  `job_form_field_id` int NOT NULL,
  `answer_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `application_statuses`
--

CREATE TABLE `application_statuses` (
  `id` int NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `application_statuses`
--

INSERT INTO `application_statuses` (`id`, `name`) VALUES
(1, 'Applied'),
(3, 'Interview'),
(4, 'Offer'),
(5, 'Rejected'),
(2, 'Screening'),
(6, 'Withdrawn');

-- --------------------------------------------------------

--
-- Table structure for table `candidate_achievements`
--

CREATE TABLE `candidate_achievements` (
  `id` int NOT NULL,
  `candidate_profile_id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `url` varchar(2083) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `candidate_attachments`
--

CREATE TABLE `candidate_attachments` (
  `id` int NOT NULL,
  `candidate_profile_id` int NOT NULL,
  `file_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'resume, cover_letter, portfolio',
  `file_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `candidate_educations`
--

CREATE TABLE `candidate_educations` (
  `id` int NOT NULL,
  `candidate_profile_id` int NOT NULL,
  `institute_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `degree` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `major_subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `graduation_year` int DEFAULT NULL,
  `result` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `candidate_profiles`
--

CREATE TABLE `candidate_profiles` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `full_name` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `earliest_join_date` date DEFAULT NULL,
  `area_id` int DEFAULT NULL,
  `linkedin_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `github_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `portfolio_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `exp_salary_min` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `exp_salary_max` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `candidate_skills`
--

CREATE TABLE `candidate_skills` (
  `candidate_profile_id` int NOT NULL,
  `skill_id` int NOT NULL,
  `proficiency` enum('beginner','intermediate','advanced','expert') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `years_experience` decimal(3,1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_experience_levels`
--

CREATE TABLE `job_experience_levels` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_experience_levels`
--

INSERT INTO `job_experience_levels` (`id`, `name`) VALUES
(1, 'Intern'),
(2, 'Junior (1-2 Years)'),
(5, 'Lead/Architect'),
(3, 'Mid-Level (3-5 Years)'),
(4, 'Senior (5+ Years)');

-- --------------------------------------------------------

--
-- Table structure for table `job_form_fields`
--

CREATE TABLE `job_form_fields` (
  `id` int NOT NULL,
  `input_type` enum('checkbox','number','text','textarea') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_form_fields`
--

INSERT INTO `job_form_fields` (`id`, `input_type`, `label`) VALUES
(13, 'number', 'How do you ensure the work culture at your worlplace?'),
(14, 'text', 'Ho many years of experince do you have working with Node.js?');

-- --------------------------------------------------------

--
-- Table structure for table `job_posts`
--

CREATE TABLE `job_posts` (
  `id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `department_id` int NOT NULL,
  `experience_level_id` int NOT NULL,
  `job_type_id` int NOT NULL,
  `status_id` int NOT NULL,
  `summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `responsibilities` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `requirements` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `benefits` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `salary_min` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `salary_max` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `form_field_id` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `form_field_id_int` int GENERATED ALWAYS AS (json_unquote(json_extract(`form_field_id`,_utf8mb4'$'))) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_posts`
--

INSERT INTO `job_posts` (`id`, `title`, `department_id`, `experience_level_id`, `job_type_id`, `status_id`, `summary`, `responsibilities`, `requirements`, `benefits`, `salary_min`, `salary_max`, `deadline`, `form_field_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
(7, 'asdasdasdsadas', 2, 5, 1, 1, 'asdasdas\ndas\nd\nsadasdasdasdas asdasdasd asd asd', 'sdfd as\ndfsad fa\nsd\nf\nsd\nf\ns d\nf\nds', 'sd\nfsd\nf\nds\nf\nd\nfd\nf', 'ef\nsd\nf\nsd\nf\ndf\ndf', '$10000 - $120000', NULL, NULL, NULL, '2025-12-01 16:00:45', '2025-12-01 16:00:45', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `job_statuses`
--

CREATE TABLE `job_statuses` (
  `id` int NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_statuses`
--

INSERT INTO `job_statuses` (`id`, `name`) VALUES
(3, 'Closed'),
(1, 'Draft'),
(2, 'Published');

-- --------------------------------------------------------

--
-- Table structure for table `job_types`
--

CREATE TABLE `job_types` (
  `id` int NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_types`
--

INSERT INTO `job_types` (`id`, `name`) VALUES
(3, 'Contract'),
(1, 'Full-time'),
(2, 'Part-time'),
(4, 'Remote');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`) VALUES
(3, 'Candidate'),
(2, 'HiringManager'),
(1, 'SuperAdmin');

-- --------------------------------------------------------

--
-- Table structure for table `system_areas`
--

CREATE TABLE `system_areas` (
  `id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_areas`
--

INSERT INTO `system_areas` (`id`, `name`) VALUES
(1, 'Banani'),
(2, 'Gulshan 1'),
(3, 'Gulshan 2'),
(4, 'Dhanmondi'),
(5, 'Mirpur'),
(6, 'Outside Dhaka');

-- --------------------------------------------------------

--
-- Table structure for table `system_departments`
--

CREATE TABLE `system_departments` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_departments`
--

INSERT INTO `system_departments` (`id`, `name`) VALUES
(1, 'Engineering'),
(2, 'Human Resources'),
(3, 'Marketing'),
(4, 'Sales');

-- --------------------------------------------------------

--
-- Table structure for table `system_skills`
--

CREATE TABLE `system_skills` (
  `id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `is_approved` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_skills`
--

INSERT INTO `system_skills` (`id`, `name`, `is_approved`) VALUES
(1, 'React.js', 1),
(2, 'Node.js', 1),
(3, 'MySQL', 1),
(4, 'Figma', 1),
(5, 'JavaScript', 1),
(6, 'Python', 1),
(7, 'Java', 1),
(8, 'PHP', 1),
(9, 'CSS', 1),
(10, 'HTML', 1),
(11, 'TypeScript', 1),
(12, 'Angular', 1),
(13, 'Vue.js', 1),
(14, 'MongoDB', 1),
(15, 'PostgreSQL', 1),
(16, 'Docker', 1),
(17, 'AWS', 1),
(18, 'Git', 1),
(19, 'UI/UX Design', 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `role_id`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'admin@augmex.io', '$2b$10$CLaZ59.UtVsfLICskQE7DObeLFvvOjKVQ2XKzq1ZhZS5sLwvuMj9C', 1, 1, '2025-11-28 11:53:53', '2025-11-29 08:16:32', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_oauth_providers`
--

CREATE TABLE `user_oauth_providers` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `provider` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `provider_user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `access_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `refresh_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_job_candidate` (`job_id`,`candidate_user_id`),
  ADD KEY `idx_apps_status` (`status_id`),
  ADD KEY `applications_ibfk_2` (`candidate_user_id`),
  ADD KEY `idx_status_created` (`status_id`,`created_at`);

--
-- Indexes for table `application_answers`
--
ALTER TABLE `application_answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `application_id` (`application_id`),
  ADD KEY `job_form_field_id` (`job_form_field_id`);

--
-- Indexes for table `application_statuses`
--
ALTER TABLE `application_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `candidate_achievements`
--
ALTER TABLE `candidate_achievements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `candidate_profile_id` (`candidate_profile_id`);

--
-- Indexes for table `candidate_attachments`
--
ALTER TABLE `candidate_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `candidate_profile_id` (`candidate_profile_id`);

--
-- Indexes for table `candidate_educations`
--
ALTER TABLE `candidate_educations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `candidate_profile_id` (`candidate_profile_id`),
  ADD KEY `idx_candidates_degree` (`degree`);

--
-- Indexes for table `candidate_profiles`
--
ALTER TABLE `candidate_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `area_id` (`area_id`);

--
-- Indexes for table `candidate_skills`
--
ALTER TABLE `candidate_skills`
  ADD PRIMARY KEY (`candidate_profile_id`,`skill_id`);

--
-- Indexes for table `job_experience_levels`
--
ALTER TABLE `job_experience_levels`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `job_form_fields`
--
ALTER TABLE `job_form_fields`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `job_posts`
--
ALTER TABLE `job_posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `experience_level_id` (`experience_level_id`),
  ADD KEY `job_type_id` (`job_type_id`),
  ADD KEY `status_id` (`status_id`),
  ADD KEY `idx_jobs_title_desc` (`title`,`summary`(100)),
  ADD KEY `idx_dept_status` (`department_id`,`status_id`),
  ADD KEY `idx_form_field_id_int` (`form_field_id_int`);
ALTER TABLE `job_posts` ADD FULLTEXT KEY `idx_jobs_search` (`title`,`summary`);

--
-- Indexes for table `job_statuses`
--
ALTER TABLE `job_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `job_types`
--
ALTER TABLE `job_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `system_areas`
--
ALTER TABLE `system_areas`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_departments`
--
ALTER TABLE `system_departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `system_skills`
--
ALTER TABLE `system_skills`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `user_oauth_providers`
--
ALTER TABLE `user_oauth_providers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_provider_user` (`provider`,`provider_user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `application_answers`
--
ALTER TABLE `application_answers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `application_statuses`
--
ALTER TABLE `application_statuses`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `candidate_achievements`
--
ALTER TABLE `candidate_achievements`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `candidate_attachments`
--
ALTER TABLE `candidate_attachments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `candidate_educations`
--
ALTER TABLE `candidate_educations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `candidate_profiles`
--
ALTER TABLE `candidate_profiles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `job_experience_levels`
--
ALTER TABLE `job_experience_levels`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `job_form_fields`
--
ALTER TABLE `job_form_fields`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `job_posts`
--
ALTER TABLE `job_posts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `job_statuses`
--
ALTER TABLE `job_statuses`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `job_types`
--
ALTER TABLE `job_types`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `system_areas`
--
ALTER TABLE `system_areas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `system_departments`
--
ALTER TABLE `system_departments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `system_skills`
--
ALTER TABLE `system_skills`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `user_oauth_providers`
--
ALTER TABLE `user_oauth_providers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `job_posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`candidate_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applications_ibfk_3` FOREIGN KEY (`status_id`) REFERENCES `application_statuses` (`id`);

--
-- Constraints for table `application_answers`
--
ALTER TABLE `application_answers`
  ADD CONSTRAINT `application_answers_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `application_answers_ibfk_2` FOREIGN KEY (`job_form_field_id`) REFERENCES `job_form_fields` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `candidate_achievements`
--
ALTER TABLE `candidate_achievements`
  ADD CONSTRAINT `candidate_achievements_ibfk_1` FOREIGN KEY (`candidate_profile_id`) REFERENCES `candidate_profiles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `candidate_attachments`
--
ALTER TABLE `candidate_attachments`
  ADD CONSTRAINT `candidate_attachments_ibfk_1` FOREIGN KEY (`candidate_profile_id`) REFERENCES `candidate_profiles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `candidate_educations`
--
ALTER TABLE `candidate_educations`
  ADD CONSTRAINT `candidate_educations_ibfk_1` FOREIGN KEY (`candidate_profile_id`) REFERENCES `candidate_profiles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `candidate_profiles`
--
ALTER TABLE `candidate_profiles`
  ADD CONSTRAINT `candidate_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `candidate_profiles_ibfk_4` FOREIGN KEY (`area_id`) REFERENCES `system_areas` (`id`);

--
-- Constraints for table `candidate_skills`
--
ALTER TABLE `candidate_skills`
  ADD CONSTRAINT `candidate_skills_ibfk_1` FOREIGN KEY (`candidate_profile_id`) REFERENCES `candidate_profiles` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `job_posts`
--
ALTER TABLE `job_posts`
  ADD CONSTRAINT `job_posts_ibfk_4` FOREIGN KEY (`department_id`) REFERENCES `system_departments` (`id`),
  ADD CONSTRAINT `job_posts_ibfk_5` FOREIGN KEY (`experience_level_id`) REFERENCES `job_experience_levels` (`id`),
  ADD CONSTRAINT `job_posts_ibfk_6` FOREIGN KEY (`job_type_id`) REFERENCES `job_types` (`id`),
  ADD CONSTRAINT `job_posts_ibfk_7` FOREIGN KEY (`status_id`) REFERENCES `job_statuses` (`id`),
  ADD CONSTRAINT `job_posts_ibfk_8` FOREIGN KEY (`form_field_id_int`) REFERENCES `job_form_fields` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

--
-- Constraints for table `user_oauth_providers`
--
ALTER TABLE `user_oauth_providers`
  ADD CONSTRAINT `user_oauth_providers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

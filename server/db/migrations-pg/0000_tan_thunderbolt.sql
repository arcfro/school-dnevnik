CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"grade_level" text,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"class_id" text NOT NULL,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	CONSTRAINT "students_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "class_subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"teacher_user_id" text NOT NULL,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	CONSTRAINT "class_subjects_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "class_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "class_subjects_teacher_user_id_users_id_fk" FOREIGN KEY ("teacher_user_id") REFERENCES "users"("id") ON DELETE restrict ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "schedule_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"lesson_index" integer NOT NULL,
	"subject_id" text NOT NULL,
	"teacher_user_id" text NOT NULL,
	"room" text,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	CONSTRAINT "schedule_slots_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "schedule_slots_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE restrict ON UPDATE no action,
	CONSTRAINT "schedule_slots_teacher_user_id_users_id_fk" FOREIGN KEY ("teacher_user_id") REFERENCES "users"("id") ON DELETE restrict ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "grade_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"date" text NOT NULL,
	"value" text NOT NULL,
	"type" text,
	"teacher_user_id" text NOT NULL,
	"comment" text,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	CONSTRAINT "grade_entries_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "grade_entries_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE restrict ON UPDATE no action,
	CONSTRAINT "grade_entries_teacher_user_id_users_id_fk" FOREIGN KEY ("teacher_user_id") REFERENCES "users"("id") ON DELETE restrict ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"date" text NOT NULL,
	"subject_id" text,
	"schedule_slot_id" text,
	"status" text NOT NULL,
	"teacher_user_id" text NOT NULL,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	CONSTRAINT "attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "attendance_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE set null ON UPDATE no action,
	CONSTRAINT "attendance_schedule_slot_id_schedule_slots_id_fk" FOREIGN KEY ("schedule_slot_id") REFERENCES "schedule_slots"("id") ON DELETE set null ON UPDATE no action,
	CONSTRAINT "attendance_teacher_user_id_users_id_fk" FOREIGN KEY ("teacher_user_id") REFERENCES "users"("id") ON DELETE restrict ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "homework" (
	"id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"due_at" integer,
	"created_by" text NOT NULL,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	CONSTRAINT "homework_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "homework_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE restrict ON UPDATE no action,
	CONSTRAINT "homework_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"payload" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"run_at" integer NOT NULL,
	"last_error" text,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"payload" text NOT NULL,
	"read_at" integer,
	"created_at" integer NOT NULL,
	CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "parent_students" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_user_id" text NOT NULL,
	"student_id" text NOT NULL,
	"created_at" integer NOT NULL,
	CONSTRAINT "parent_students_parent_user_id_users_id_fk" FOREIGN KEY ("parent_user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "parent_students_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" integer NOT NULL,
	CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "bitrix_links" (
	"id" text PRIMARY KEY NOT NULL,
	"local_entity" text NOT NULL,
	"local_id" text NOT NULL,
	"b24_entity" text NOT NULL,
	"b24_id" text,
	"sync_state" text DEFAULT 'pending' NOT NULL,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");
--> statement-breakpoint
CREATE INDEX "students_class_id_idx" ON "students" ("class_id");
--> statement-breakpoint
CREATE INDEX "class_subjects_class_id_idx" ON "class_subjects" ("class_id");
--> statement-breakpoint
CREATE INDEX "class_subjects_subject_id_idx" ON "class_subjects" ("subject_id");
--> statement-breakpoint
CREATE INDEX "class_subjects_teacher_user_id_idx" ON "class_subjects" ("teacher_user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "class_subjects_class_subject_idx" ON "class_subjects" ("class_id","subject_id");
--> statement-breakpoint
CREATE INDEX "schedule_slots_class_id_idx" ON "schedule_slots" ("class_id");
--> statement-breakpoint
CREATE INDEX "schedule_slots_subject_id_idx" ON "schedule_slots" ("subject_id");
--> statement-breakpoint
CREATE INDEX "schedule_slots_teacher_user_id_idx" ON "schedule_slots" ("teacher_user_id");
--> statement-breakpoint
CREATE INDEX "grade_entries_student_id_idx" ON "grade_entries" ("student_id");
--> statement-breakpoint
CREATE INDEX "grade_entries_subject_id_idx" ON "grade_entries" ("subject_id");
--> statement-breakpoint
CREATE INDEX "grade_entries_teacher_user_id_idx" ON "grade_entries" ("teacher_user_id");
--> statement-breakpoint
CREATE INDEX "grade_entries_date_idx" ON "grade_entries" ("date");
--> statement-breakpoint
CREATE INDEX "attendance_student_id_idx" ON "attendance" ("student_id");
--> statement-breakpoint
CREATE INDEX "attendance_subject_id_idx" ON "attendance" ("subject_id");
--> statement-breakpoint
CREATE INDEX "attendance_schedule_slot_id_idx" ON "attendance" ("schedule_slot_id");
--> statement-breakpoint
CREATE INDEX "attendance_teacher_user_id_idx" ON "attendance" ("teacher_user_id");
--> statement-breakpoint
CREATE INDEX "attendance_date_idx" ON "attendance" ("date");
--> statement-breakpoint
CREATE INDEX "homework_class_id_idx" ON "homework" ("class_id");
--> statement-breakpoint
CREATE INDEX "homework_subject_id_idx" ON "homework" ("subject_id");
--> statement-breakpoint
CREATE INDEX "homework_created_by_idx" ON "homework" ("created_by");
--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" ("status");
--> statement-breakpoint
CREATE INDEX "jobs_run_at_idx" ON "jobs" ("run_at");
--> statement-breakpoint
CREATE INDEX "jobs_type_idx" ON "jobs" ("type");
--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" ("user_id");
--> statement-breakpoint
CREATE INDEX "notifications_read_at_idx" ON "notifications" ("read_at");
--> statement-breakpoint
CREATE INDEX "parent_students_parent_user_id_idx" ON "parent_students" ("parent_user_id");
--> statement-breakpoint
CREATE INDEX "parent_students_student_id_idx" ON "parent_students" ("student_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "parent_students_parent_student_idx" ON "parent_students" ("parent_user_id","student_id");
--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions" ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_endpoint_idx" ON "push_subscriptions" ("endpoint");
--> statement-breakpoint
CREATE INDEX "bitrix_links_local_idx" ON "bitrix_links" ("local_entity","local_id");
--> statement-breakpoint
CREATE INDEX "bitrix_links_b24_idx" ON "bitrix_links" ("b24_entity","b24_id");

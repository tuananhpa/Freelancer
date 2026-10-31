CREATE TABLE classrooms (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    section VARCHAR(255),
    subject VARCHAR(255),
    invite_code VARCHAR(10) UNIQUE NOT NULL,
    teacher_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_classrooms_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE class_members (
    id UUID PRIMARY KEY,
    classroom_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(20) DEFAULT 'STUDENT',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_class_members_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_class_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_classroom_user UNIQUE (classroom_id, user_id)
);

CREATE TABLE class_posts (
    id UUID PRIMARY KEY,
    classroom_id UUID NOT NULL,
    author_id UUID NOT NULL,
    type VARCHAR(30) DEFAULT 'ANNOUNCEMENT',
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_class_posts_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_class_posts_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
);

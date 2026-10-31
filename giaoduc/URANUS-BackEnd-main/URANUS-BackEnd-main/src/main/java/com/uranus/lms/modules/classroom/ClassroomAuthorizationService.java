package com.uranus.lms.modules.classroom;

import com.uranus.lms.modules.user.Role;
import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ClassroomAuthorizationService {

    private final ClassMemberRepository classMemberRepository;

    /**
     * Checks if the given user has teacher-level permissions for the classroom.
     * <p>
     * A user has teacher permissions if:
     * 1. They are an ADMIN.
     * 2. They are the primary creator/teacher of the classroom.
     * 3. They are a member of the classroom with the TEACHER role.
     *
     * @param classroom The classroom to check against
     * @param user      The user to verify
     * @return true if the user can manage the classroom, false otherwise
     */
    public boolean canManageClassroom(Classroom classroom, User user) {
        if (user == null || classroom == null) {
            return false;
        }

        // 1. Admin and Office always have full access
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.OFFICE) {
            return true;
        }

        // 2. Primary creator/teacher of the classroom
        if (classroom.getTeacher() != null && classroom.getTeacher().getId().equals(user.getId())) {
            return true;
        }

        // 3. Check if user is a member with TEACHER or TA role
        if (classMemberRepository.existsByClassroomIdAndUserIdAndRole(classroom.getId(), user.getId(), ClassMemberRole.TEACHER)
                || classMemberRepository.existsByClassroomIdAndUserIdAndRole(classroom.getId(), user.getId(), ClassMemberRole.TA)) {
            return true;
        }

        // 4. Any user who has system role TEACHER or TEACHING_ASSISTANT and is a member of the classroom
        if ((user.getRole() == Role.TEACHER || user.getRole() == Role.TEACHING_ASSISTANT)
                && classMemberRepository.existsByClassroomIdAndUserId(classroom.getId(), user.getId())) {
            return true;
        }

        return false;
    }

    /**
     * Checks if the given user is a teacher or a teaching assistant for the classroom.
     */
    public boolean isTeacherOrTA(Classroom classroom, User user) {
        if (canManageClassroom(classroom, user)) {
            return true;
        }
        return classMemberRepository.existsByClassroomIdAndUserIdAndRole(classroom.getId(), user.getId(), ClassMemberRole.TA);
    }
}

package com.uranus.lms.modules.exam;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.classroom.ClassResource;
import com.uranus.lms.modules.classroom.ClassResourceRepository;
import com.uranus.lms.modules.classroom.ClassExam;
import com.uranus.lms.modules.classroom.ClassExamRepository;
import com.uranus.lms.modules.classroom.ClassroomAuthorizationService;
import com.uranus.lms.modules.resource.ContentResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExamAccessControlService {

    private final ClassResourceRepository classResourceRepository;
    private final ClassroomAuthorizationService classroomAuthorizationService;
    private final ClassExamRepository classExamRepository;
    private final com.uranus.lms.modules.classroom.ClassMemberRepository classMemberRepository;
    private final ContentResourceRepository contentResourceRepository;

    /**
     * Cho phep hien dap an/giai thich khi hoc sinh tu luyen tap de thi gan
     * trong Kho hoc lieu (khong tinh gio, khong cham diem that). Chi dung khi
     * de thi KHONG duoc gan vao bat ky lop hoc nao, de tranh lo dap an cho
     * cac de dang thi/proctored dung chung id.
     */
    public boolean isPureLibraryExam(Exam exam, UUID libraryResourceId) {
        if (libraryResourceId == null) {
            return false;
        }
        if (!contentResourceRepository.existsByIdAndAttachedExamId(libraryResourceId, exam.getId())) {
            return false;
        }
        boolean assignedToClassroom = !classResourceRepository.findByResourceId(exam.getId()).isEmpty()
                || !classExamRepository.findByExamId(exam.getId()).isEmpty();
        return !assignedToClassroom;
    }

    /**
     * Cho phep hoc sinh mo/lam de thi du visibility la CLASSROOM (khong nam
     * trong lop cua ho), neu de duoc gan vao mot tai nguyen CONG KHAI trong
     * Kho hoc lieu - vi tai nguyen do da the hien y dinh cua giao vien la
     * cho moi nguoi tu do luyen tap. Khac voi isPureLibraryExam, cho nay
     * KHONG doi hoi de phai chua duoc gan vao lop hoc nao ca.
     */
    public boolean isAccessibleViaPublicLibraryResource(Exam exam, UUID libraryResourceId) {
        if (libraryResourceId == null) {
            return false;
        }
        return contentResourceRepository.findById(libraryResourceId)
                .filter(r -> r.getAttachedExam() != null && r.getAttachedExam().getId().equals(exam.getId()))
                .filter(r -> Boolean.TRUE.equals(r.getIsPublic()))
                .isPresent();
    }

    /**
     * Checks if a user has permission to edit the exam.
     * Throws an exception if unauthorized.
     */
    public void verifyEditPermission(Exam exam, User user) {
        if (!hasEditPermission(exam, user)) {
            throw new BadRequestException("Bạn không có quyền chỉnh sửa đề thi này.");
        }
    }

    public boolean hasEditPermission(Exam exam, User user) {
        if (user == null) {
            return false;
        }
        if (com.uranus.lms.modules.user.Role.ADMIN == user.getRole() || com.uranus.lms.modules.user.Role.OFFICE == user.getRole()) {
            return true;
        }
        if (exam.getTeacher() != null && exam.getTeacher().getId().equals(user.getId())) {
            return true;
        }
        
        // Check if the exam is assigned to any classroom where the user is a teacher or TA
        // via class_resources table (legacy)
        List<ClassResource> resources = classResourceRepository.findByResourceId(exam.getId());
        for (ClassResource resource : resources) {
            if (resource.getClassroom() != null) {
                if (classroomAuthorizationService.isTeacherOrTA(resource.getClassroom(), user)) {
                    return true;
                }
                if ((user.getRole() == com.uranus.lms.modules.user.Role.TEACHER || user.getRole() == com.uranus.lms.modules.user.Role.TEACHING_ASSISTANT)
                        && classMemberRepository.existsByClassroomIdAndUserId(resource.getClassroom().getId(), user.getId())) {
                    return true;
                }
            }
        }

        // Check if the exam is assigned to any classroom where the user is a teacher or TA
        // via class_exams table (new)
        List<ClassExam> classExams = classExamRepository.findByExamId(exam.getId());
        for (ClassExam classExam : classExams) {
            if (classExam.getClassroom() != null) {
                if (classroomAuthorizationService.isTeacherOrTA(classExam.getClassroom(), user)) {
                    return true;
                }
                if ((user.getRole() == com.uranus.lms.modules.user.Role.TEACHER || user.getRole() == com.uranus.lms.modules.user.Role.TEACHING_ASSISTANT)
                        && classMemberRepository.existsByClassroomIdAndUserId(classExam.getClassroom().getId(), user.getId())) {
                    return true;
                }
            }
        }

        return false;
    }
}

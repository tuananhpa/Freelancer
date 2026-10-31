package com.uranus.lms.modules.student;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import java.time.LocalDate;

public class StudentProfileSpecification {

    public static Specification<StudentProfile> buildSpecification(
            String keyword,
            String className,
            String facility,
            String status,
            String teacherName,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        return (root, query, cb) -> {
            var predicates = cb.conjunction();

            if (StringUtils.hasText(keyword)) {
                String likeKeyword = "%" + keyword.trim().toLowerCase() + "%";
                var keywordPredicate = cb.or(
                        cb.like(cb.lower(root.get("studentCode")), likeKeyword),
                        cb.like(cb.lower(root.get("fullName")), likeKeyword),
                        cb.like(cb.lower(root.get("phone")), likeKeyword)
                );
                predicates = cb.and(predicates, keywordPredicate);
            }

            if (StringUtils.hasText(facility)) {
                predicates = cb.and(predicates, cb.like(cb.lower(root.get("facility")), "%" + facility.trim().toLowerCase() + "%"));
            }

            if (StringUtils.hasText(status)) {
                predicates = cb.and(predicates, cb.equal(root.get("status"), status.trim()));
            }

            if (fromDate != null) {
                predicates = cb.and(predicates, cb.greaterThanOrEqualTo(root.get("dateOfBirth"), fromDate));
            }

            if (toDate != null) {
                predicates = cb.and(predicates, cb.lessThanOrEqualTo(root.get("dateOfBirth"), toDate));
            }

            if (StringUtils.hasText(className) || StringUtils.hasText(teacherName)) {
                Join<Object, Object> enrollmentsJoin = root.join("enrollments", JoinType.INNER);
                Join<Object, Object> classroomJoin = enrollmentsJoin.join("classroom", JoinType.INNER);

                if (StringUtils.hasText(className)) {
                    predicates = cb.and(predicates, cb.like(cb.lower(classroomJoin.get("name")), "%" + className.trim().toLowerCase() + "%"));
                }

                if (StringUtils.hasText(teacherName)) {
                    Join<Object, Object> teacherJoin = classroomJoin.join("teacher", JoinType.INNER);
                    predicates = cb.and(predicates, cb.like(cb.lower(teacherJoin.get("fullName")), "%" + teacherName.trim().toLowerCase() + "%"));
                }
                
                query.distinct(true);
            }

            return predicates;
        };
    }
}

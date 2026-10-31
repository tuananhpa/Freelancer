package com.uranus.lms.modules.access;

import com.uranus.lms.modules.classroom.ClassMemberRepository;
import com.uranus.lms.modules.classroom.ClassResourceRepository;
import com.uranus.lms.modules.user.Role;
import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentResourceAccessService {

    private final ClassMemberRepository classMemberRepository;
    private final ClassResourceRepository classResourceRepository;

    public record ResourceRef(UUID id, UUID ownerId, Visibility visibility) {}

    public boolean isStaff(User user) {
        return user != null && (user.getRole() == Role.TEACHER || user.getRole() == Role.TEACHING_ASSISTANT || user.getRole() == Role.ADMIN);
    }

    @Transactional(readOnly = true)
    public Map<UUID, ResourceAccessDecision> decideForResources(User user, List<ResourceRef> resources) {
        Map<UUID, ResourceAccessDecision> result = new HashMap<>();
        if (resources == null || resources.isEmpty()) {
            return result;
        }

        for (ResourceRef r : resources) {
            result.put(r.id(), decideSingle(user, r.id(), r.visibility(), r.ownerId()));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public ResourceAccessDecision decideSingle(User user, UUID resourceId, Visibility visibility, UUID ownerId) {
        if (isStaff(user) || (user != null && ownerId != null && ownerId.equals(user.getId()))) {
            return ResourceAccessDecision.full();
        }

        if (visibility == Visibility.PUBLIC) {
            return ResourceAccessDecision.full();
        }

        if (visibility == Visibility.HIDDEN) {
            // Hidden resources can be fully accessed if the user has the link (ID).
            return ResourceAccessDecision.full();
        }

        if (visibility == Visibility.CLASSROOM) {
            if (user == null) {
                return ResourceAccessDecision.previewLocked();
            }
            // Check if the user is in any classroom that has this resource
            boolean hasAccess = classResourceRepository.findByResourceId(resourceId).stream()
                    .anyMatch(cr -> classMemberRepository.existsByClassroomIdAndUserId(cr.getClassroom().getId(), user.getId()));
            if (hasAccess) {
                return ResourceAccessDecision.full();
            }
            return ResourceAccessDecision.previewLocked();
        }

        return ResourceAccessDecision.previewLocked();
    }
}

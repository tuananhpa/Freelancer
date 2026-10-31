package com.uranus.lms.config;

import com.uranus.lms.modules.user.User;
import com.uranus.lms.security.UserDetailsImpl;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.List;

/**
 * Cho phep controller khai bao thang @AuthenticationPrincipal User thay vi
 * UserDetailsImpl. JwtAuthFilter dat principal la UserDetailsImpl (boc ngoai
 * User) chu khong phai User truc tiep, nen @AuthenticationPrincipal User luon
 * tra ve null - moi cho dang dung kieu nay (DiscussionController,
 * CalendarEventController, CertificateController) deu bi NullPointerException
 * hoac am tham lay du lieu rong khi chay that.
 */
@Component
public class WebMvcConfig implements org.springframework.web.servlet.config.annotation.WebMvcConfigurer {

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new AuthenticationPrincipalUserResolver());
    }

    static class AuthenticationPrincipalUserResolver implements HandlerMethodArgumentResolver {
        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                    && User.class.equals(parameter.getParameterType());
        }

        @Override
        public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                       NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !(auth.getPrincipal() instanceof UserDetailsImpl userDetails)) {
                return null;
            }
            return userDetails.getUser();
        }
    }
}

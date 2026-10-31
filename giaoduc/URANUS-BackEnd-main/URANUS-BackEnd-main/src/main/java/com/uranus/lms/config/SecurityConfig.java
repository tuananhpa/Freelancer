package com.uranus.lms.config;

import jakarta.servlet.http.HttpServletResponse;
import com.uranus.lms.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers(
                        "/api/auth/**",
                        "/api/public/**",
                        "/api/v1/files/download/**",
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/ws/**"
                ).permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/courses/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/exams/public/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/exams/{id:[0-9a-fA-F\\-]+}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/resources", "/api/resources/{id:[0-9a-fA-F\\-]+}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/students/verify-code").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/students/register").permitAll()
                // Support chat: khach vang lai chua co JWT. Quyen truy cap tung hoi thoai
                // duoc kiem tra trong SupportService bang guest token, khong phai o day.
                .requestMatchers(HttpMethod.POST, "/api/support/guest-session").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/support/conversations/*", "/api/support/conversations/*/messages").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/support/conversations/*/messages").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/support/conversations/*/attachments").permitAll()
                // Admin only
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // Hoc sinh dang ky khoa hoc / danh dau hoan thanh bai hoc - phai dat
                // TRUOC luat TEACHER/ADMIN ben duoi, vi ca hai deu nam duoi /api/courses/**
                // va Spring Security khop luat dau tien thoa man theo thu tu khai bao.
                .requestMatchers(HttpMethod.POST, "/api/courses/*/enroll", "/api/courses/lessons/*/complete").authenticated()
                // Resources: Like, bookmark, and my lists are authenticated
                .requestMatchers(HttpMethod.POST, "/api/resources/*/like", "/api/resources/*/bookmark").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/resources/my-bookmarks", "/api/resources/my-uploads").authenticated()
                // Writing-prompt submissions: hoc sinh (moi vai tro) duoc nop/xem bai
                // cua chinh minh; xem danh sach toan bo + cham diem duoc rang buoc them
                // trong ResourceSubmissionService (chi nguoi dang tai / ADMIN / OFFICE).
                .requestMatchers(HttpMethod.POST, "/api/resources/*/submissions", "/api/resources/submissions/*/grade").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/resources/*/submissions", "/api/resources/*/submissions/me").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/resources", "/api/resources/**").hasAnyRole("TEACHER", "TEACHING_ASSISTANT", "ADMIN", "STAFF")
                .requestMatchers(HttpMethod.PUT, "/api/resources/**").hasAnyRole("TEACHER", "TEACHING_ASSISTANT", "ADMIN", "STAFF")
                .requestMatchers(HttpMethod.DELETE, "/api/resources/**").hasAnyRole("TEACHER", "TEACHING_ASSISTANT", "ADMIN", "STAFF")
                // Teacher + Admin (+ TEACHING_ASSISTANT cho POST/PUT: nhieu @PreAuthorize
                // o ExamController/ExamImportController/CourseController da cho phep TA
                // sua bai giang/de thi, nhung luat URL nay chay TRUOC va chan TA truoc khi
                // request cham toi @PreAuthorize - TA bi 403 ngay ca o cho ho duoc phep.
                // DELETE section/lesson cho TA (CourseController.deleteSection/deleteLesson
                // tu @PreAuthorize da cho phep TA, nhung luat rong ben duoi se chan truoc
                // neu khong tach rieng). Xoa ca khoa hoc (deleteCourse) van gioi han
                // TEACHER/ADMIN.
                .requestMatchers(HttpMethod.DELETE, "/api/courses/sections/**", "/api/courses/lessons/**").hasAnyRole("TEACHER", "TEACHING_ASSISTANT", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/courses/**").hasAnyRole("TEACHER", "TEACHING_ASSISTANT", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/courses/**").hasAnyRole("TEACHER", "TEACHING_ASSISTANT", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/courses/**").hasAnyRole("TEACHER", "ADMIN")
                // Allow students to start/submit exams, danh dau yeu thich, va xac thuc
                // mat khau de vao de thi HIDDEN - deu la hanh dong cua nguoi lam bai,
                // khong phai quan ly de thi.
                .requestMatchers(HttpMethod.POST, "/api/exams/*/start", "/api/exams/*/submit", "/api/exams/*/draft", "/api/exams/*/favorite", "/api/exams/*/verify-password").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/exams", "/api/exams/**").hasAnyRole("TEACHER", "TEACHING_ASSISTANT", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/exams", "/api/exams/**").hasAnyRole("TEACHER", "TEACHING_ASSISTANT", "ADMIN")
                // Truoc day DELETE /api/exams/** khong co luat URL nao ca, chi dua vao
                // kiem tra o service (ExamAccessControlService) - van an toan nhung
                // them luat o day de nhat quan phong thu nhieu lop voi POST/PUT o tren.
                .requestMatchers(HttpMethod.DELETE, "/api/exams/**").hasAnyRole("TEACHER", "TEACHING_ASSISTANT", "ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"status\":401,\"message\":\"Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"status\":403,\"message\":\"Bạn không có quyền thực hiện hành động này.\"}");
                })
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

package com.uranus.lms.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    // Auth Errors
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Bạn chưa đăng nhập hoặc token đã hết hạn."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện hành động này."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "Người dùng không tồn tại."),
    INVALID_CREDENTIALS(HttpStatus.BAD_REQUEST, "Tên đăng nhập hoặc mật khẩu không chính xác."),
    ACCOUNT_LOCKED(HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị khóa."),
    EMAIL_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "Email đã được sử dụng."),
    
    // Resource Errors
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy tài nguyên yêu cầu."),
    
    // Exam Errors
    EXAM_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy đề thi."),
    EXAM_CLOSED(HttpStatus.BAD_REQUEST, "Đề thi đã đóng."),
    EXAM_NOT_OPENED(HttpStatus.BAD_REQUEST, "Đề thi chưa đến giờ mở."),
    OUT_OF_ATTEMPTS(HttpStatus.BAD_REQUEST, "Bạn đã hết số lần làm bài cho phép."),
    ACCESS_CODE_REQUIRED(HttpStatus.BAD_REQUEST, "Đề thi này yêu cầu mã truy cập."),
    INVALID_ACCESS_CODE(HttpStatus.BAD_REQUEST, "Mã truy cập không chính xác."),

    // Generic Errors
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "Dữ liệu đầu vào không hợp lệ."),
    SUPPORT_RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "Bạn đã mở quá nhiều cuộc trò chuyện. Vui lòng thử lại sau."),
    SYSTEM_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống. Vui lòng thử lại sau.");

    private final HttpStatus httpStatus;
    private final String message;

    ErrorCode(HttpStatus httpStatus, String message) {
        this.httpStatus = httpStatus;
        this.message = message;
    }
}

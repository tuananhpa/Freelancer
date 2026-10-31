-- Support chat: hoi thoai giua nguoi dung (hoac khach vang lai) va bo phan ho tro (OFFICE)

CREATE TABLE IF NOT EXISTS support_conversations (
    id                UUID PRIMARY KEY,
    requester_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_token       VARCHAR(64) UNIQUE,
    guest_name        VARCHAR(150),
    guest_contact     VARCHAR(150),
    assignee_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    subject           VARCHAR(255),
    created_at        TIMESTAMP    NOT NULL DEFAULT now(),
    last_message_at   TIMESTAMP,
    closed_at         TIMESTAMP,
    -- Dung mot trong hai danh tinh: user da dang nhap HOAC khach vang lai
    CONSTRAINT support_conv_requester_xor_guest CHECK (
        (requester_id IS NOT NULL AND guest_token IS NULL)
        OR (requester_id IS NULL AND guest_token IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_support_conv_requester ON support_conversations(requester_id);
CREATE INDEX IF NOT EXISTS idx_support_conv_assignee  ON support_conversations(assignee_id);
CREATE INDEX IF NOT EXISTS idx_support_conv_status    ON support_conversations(status, last_message_at DESC);

CREATE TABLE IF NOT EXISTS support_messages (
    id               UUID PRIMARY KEY,
    conversation_id  UUID        NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
    sender_id        UUID        REFERENCES users(id) ON DELETE SET NULL,
    -- REQUESTER = nguoi dung/khach mo hoi thoai, AGENT = ho tro vien.
    -- Giu rieng voi sender_id de tin nhan cua khach van dung phia sau khi ho dang nhap.
    sender_role      VARCHAR(16) NOT NULL,
    content          TEXT        NOT NULL,
    sent_at          TIMESTAMP   NOT NULL DEFAULT now(),
    read_at          TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_msg_conversation ON support_messages(conversation_id, sent_at);

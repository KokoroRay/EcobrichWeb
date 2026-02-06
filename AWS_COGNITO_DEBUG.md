# 🔍 Hướng dẫn kiểm tra AWS Cognito khi gặp lỗi đăng nhập

## 📋 Checklist kiểm tra khi gặp lỗi

### 1. **Kiểm tra User Pool ID và Client ID**

Đảm bảo các giá trị trong `.env` khớp với AWS Cognito:

```env
VITE_COGNITO_USER_POOL_ID=ap-southeast-1_ced2mMaLA
VITE_COGNITO_CLIENT_ID=4vt5k7hcgrbregji8i3q7lmp3i
VITE_AWS_REGION=ap-southeast-1
```

**Cách check:**
1. Vào AWS Console → Cognito → User pools
2. Click vào pool của bạn
3. Copy **User pool ID** từ tab "User pool overview"
4. Vào tab "App integration" → "App clients" → Copy **Client ID**

---

### 2. **Kiểm tra Password Policy**

**Vào:** User pool → Sign-in experience → Password policy

Mật khẩu phải đáp ứng:
- ✅ Có ít nhất 8 ký tự
- ✅ Có chữ thường (a-z)
- ✅ Có chữ hoa (A-Z)  
- ✅ Có số (0-9)
- ✅ Có ký tự đặc biệt (!@#$%^&*)

**Lỗi thường gặp:** `InvalidPasswordException` nếu mật khẩu không đủ mạnh.

---

### 3. **Kiểm tra Email Verification**

**Vào:** User pool → Sign-up experience → Attribute verification and user account confirmation

**Settings cần có:**
- ✅ **Attributes to verify:** Email
- ✅ **Active attribute values for sign-in:** Email
- ✅ **Email verification message:** phải có template gửi mã

**Lỗi thường gặp:**
- `UserNotConfirmedException` - User chưa confirm email
- Email không nhận được mã → Check SES configuration

---

### 4. **Kiểm tra MFA Settings**

**Vào:** User pool → Sign-in experience → MFA

**Recommended:**
- ✅ **MFA enforcement:** Optional
- ❌ Không nên để Required nếu chưa setup SMS/TOTP

**Lỗi:** Nếu MFA required nhưng user chưa setup → login sẽ fail

---

### 5. **Kiểm tra App Client Settings**

**Vào:** User pool → App integration → App clients → [Your client]

**Authentication flows phải enable:**
- ✅ `ALLOW_USER_PASSWORD_AUTH` - Cho phép đăng nhập username/password
- ✅ `ALLOW_REFRESH_TOKEN_AUTH` - Cho phép refresh token
- ✅ `ALLOW_USER_SRP_AUTH` - Secure Remote Password protocol

**Lỗi:** Nếu thiếu `ALLOW_USER_PASSWORD_AUTH` → sẽ không thể login với email/password

---

### 6. **Kiểm tra User Status**

**Vào:** User pool → Users → [Select user]

**Status phải là:**
- ✅ **Account status:** CONFIRMED
- ✅ **Email verified:** true
- ❌ **Account status:** UNCONFIRMED → phải confirm email trước

**Cách confirm manually:**
```bash
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id ap-southeast-1_ced2mMaLA \
  --username user@example.com
```

---

### 7. **Kiểm tra CloudWatch Logs**

**Vào:** CloudWatch → Log groups → `/aws/cognito/userpools/[your-pool-id]`

**Xem logs để debug:**
- Sign-in attempts
- Failed authentication
- Token generation

---

### 8. **Test với AWS CLI**

```bash
# Test đăng nhập
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 4vt5k7hcgrbregji8i3q7lmp3i \
  --auth-parameters USERNAME=user@example.com,PASSWORD=YourPassword123!

# List users
aws cognito-idp list-users \
  --user-pool-id ap-southeast-1_ced2mMaLA

# Get user details
aws cognito-idp admin-get-user \
  --user-pool-id ap-southeast-1_ced2mMaLA \
  --username user@example.com
```

---

## 🔥 Common Errors và Giải pháp

| Error Code | Nguyên nhân | Giải pháp |
|------------|-------------|-----------|
| `NotAuthorizedException` | Sai mật khẩu | Kiểm tra lại password hoặc reset |
| `UserNotFoundException` | Email chưa đăng ký | Đăng ký tài khoản mới |
| `UserNotConfirmedException` | Chưa xác thực email | Confirm email hoặc dùng admin-confirm-sign-up |
| `InvalidPasswordException` | Mật khẩu không đủ mạnh | Đổi mật khẩu theo policy |
| `LimitExceededException` | Quá nhiều request | Đợi 15 phút và thử lại |
| `CodeMismatchException` | Mã OTP sai | Kiểm tra lại mã hoặc gửi lại |
| `ExpiredCodeException` | Mã OTP hết hạn | Yêu cầu gửi mã mới |

---

## 🧪 Test Flow đầy đủ

### **1. Đăng ký tài khoản mới:**
```bash
aws cognito-idp sign-up \
  --client-id 4vt5k7hcgrbregji8i3q7lmp3i \
  --username test@example.com \
  --password TestPassword123! \
  --user-attributes Name=email,Value=test@example.com
```

### **2. Confirm với mã OTP:**
```bash
aws cognito-idp confirm-sign-up \
  --client-id 4vt5k7hcgrbregji8i3q7lmp3i \
  --username test@example.com \
  --confirmation-code 123456
```

### **3. Login:**
```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 4vt5k7hcgrbregji8i3q7lmp3i \
  --auth-parameters USERNAME=test@example.com,PASSWORD=TestPassword123!
```

### **4. Reset password:**
```bash
# Step 1: Request reset
aws cognito-idp forgot-password \
  --client-id 4vt5k7hcgrbregji8i3q7lmp3i \
  --username test@example.com

# Step 2: Confirm with code
aws cognito-idp confirm-forgot-password \
  --client-id 4vt5k7hcgrbregji8i3q7lmp3i \
  --username test@example.com \
  --confirmation-code 123456 \
  --password NewPassword123!
```

---

## 📧 Kiểm tra Email Configuration

**Vào:** User pool → Messaging → Email

**Settings:**
- **Configuration type:** 
  - ✅ Send email with Amazon SES (production)
  - ❌ Send email with Cognito (dev only, giới hạn 50 emails/day)

**Nếu dùng SES:**
1. Verify email sender trong SES
2. Check SES sandbox mode (chỉ gửi cho verified emails)
3. Request production access nếu cần

---

## 🔐 Security Best Practices

1. **Enable MFA** cho admin accounts
2. **Password rotation** policy
3. **Advanced security features:**
   - Compromised credential checks
   - Adaptive authentication
4. **Logs và Monitoring:** Enable CloudWatch

---

## 📞 Support

Nếu vẫn gặp lỗi sau khi check tất cả:
1. Check AWS Service Health Dashboard
2. Contact AWS Support
3. Review Cognito quota limits (default: 10,000 users)

---

**Created:** 2026-02-06
**Last Updated:** 2026-02-06

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: 'Arial', sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
        .email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden; }
        .header { background-color: #D99485; /* Màu vàng Gold sang trọng hợp với trang sức */ color: #ffffff; text-align: center; padding: 30px 20px; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase; }
        .content { padding: 40px 30px; color: #333333; line-height: 1.6; text-align: center; }
        .otp-box { background-color: #f8fafc; border: 2px dashed #D99485; border-radius: 8px; padding: 20px; margin: 30px auto; max-width: 250px; }
        .otp-code { font-size: 36px; font-weight: bold; color: #D99485; letter-spacing: 5px; margin: 0; }
        .footer { background-color: #f8fafc; color: #64748b; text-align: center; padding: 20px; font-size: 13px; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Lumina Jewelry</h1>
        </div>
        <div class="content">
            <h2 style="color: #333; margin-top: 0;">{{ $title }}</h2>
            <p>Xin chào,</p>
            <p>Chúng tôi nhận được yêu cầu xác thực từ bạn. Vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình. Mã này có hiệu lực trong vòng 10 phút.</p>
            
            <div class="otp-box">
                <p class="otp-code">{{ $otp }}</p>
            </div>
            
            <p style="color: #ef4444; font-size: 14px;">
                <em>Tuyệt đối không chia sẻ mã này cho bất kỳ ai!</em>
            </p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} Lumina Jewelry. Bảo lưu mọi quyền.</p>
        </div>
    </div>
</body>
</html>
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Certificate of Completion</title>
    <style>
        @page {
            margin: 0;
            padding: 0;
            size: A4 landscape;  /* 297mm × 210mm */
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            margin: 0;
            padding: 0;
            color: #ffffff;
            position: relative;
            width: 297mm;
            height: 210mm;
        }
        .certificate {
            width: 297mm;
            height: 210mm;
            padding: 12mm;
            box-sizing: border-box;
            position: relative;
            background: #0f172a;
            background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.1) 1px, transparent 0);
            background-size: 20px 20px;
        }
        .border {
            position: absolute;
            top: 8mm;
            left: 8mm;
            right: 8mm;
            bottom: 8mm;
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
        }
        .inner-border {
            position: absolute;
            top: 12mm;
            left: 12mm;
            right: 12mm;
            bottom: 12mm;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
        }
        .content {
            position: relative;
            z-index: 1;
            text-align: center;
            padding: 12mm 15mm;
            height: calc(210mm - 24mm);
            display: flex;
            flex-direction: column;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15mm;
        }
        .logo {
            text-align: left;
        }
        .logo img {
            height: 8mm;
            filter: brightness(0) invert(1);
        }
        .medal {
            position: absolute;
            top: 8mm;
            right: 12mm;
            display: flex;
            align-items: center;
            gap: 2mm;
        }
        .year {
            font-size: 20px;
            font-weight: bold;
            color: #fbbf24;
        }
        .certificate-title {
            font-size: 16px;
            color: #fbbf24;
            margin-bottom: 8mm;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 4px;
        }
        .recipient-name {
            font-size: 32px;
            margin-bottom: 4mm;
            font-weight: bold;
            color: #ffffff;
        }
        .completion-text {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 4mm;
        }
        .course-name {
            font-size: 24px;
            color: #fbbf24;
            margin-bottom: 8mm;
            max-width: 80%;
            margin-left: auto;
            margin-right: auto;
            line-height: 1.3;
            font-weight: bold;
        }
        .grade {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 8mm;
        }
        .skills-section {
            margin-bottom: 8mm;
        }
        .skills-title {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 4mm;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .skills-list {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 2mm;
            max-width: 80%;
            margin: 0 auto;
        }
        .skill-badge {
            background: rgba(251, 191, 36, 0.1);
            color: #fbbf24;
            padding: 1.5mm 3mm;
            border-radius: 3mm;
            font-size: 11px;
            font-weight: 500;
        }
        .signatures {
            display: flex;
            justify-content: space-between;
            padding: 0 35mm;
            margin-top: auto;
            margin-bottom: 20mm;
        }
        .signature {
            text-align: center;
            width: 50mm;
        }
        .signature-line {
            width: 100%;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            margin-bottom: 2mm;
        }
        .signature-name {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 1mm;
            color: #ffffff;
        }
        .signature-title {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.7);
        }
        .certificate-footer {
            position: absolute;
            bottom: 16mm;
            left: 20mm;
            right: 20mm;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .qr-section {
            text-align: left;
        }
        .qr-code {
            width: 18mm;
            height: 18mm;
            margin-bottom: 2mm;
            background: white;
            padding: 1.5mm;
            border-radius: 2mm;
        }
        .credential-id {
            font-size: 9px;
            color: rgba(255, 255, 255, 0.6);
        }
        .issue-date {
            text-align: right;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.6);
        }
        .corner-decoration {
            position: absolute;
            width: 20mm;
            height: 20mm;
            border: 2px solid #fbbf24;
            opacity: 0.3;
        }
        .top-left {
            top: 6mm;
            left: 6mm;
            border-right: 0;
            border-bottom: 0;
            border-top-left-radius: 12px;
        }
        .top-right {
            top: 6mm;
            right: 6mm;
            border-left: 0;
            border-bottom: 0;
            border-top-right-radius: 12px;
        }
        .bottom-left {
            bottom: 6mm;
            left: 6mm;
            border-right: 0;
            border-top: 0;
            border-bottom-left-radius: 12px;
        }
        .bottom-right {
            bottom: 6mm;
            right: 6mm;
            border-left: 0;
            border-top: 0;
            border-bottom-right-radius: 12px;
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="border"></div>
        <div class="inner-border"></div>
        <div class="corner-decoration top-left"></div>
        <div class="corner-decoration top-right"></div>
        <div class="corner-decoration bottom-left"></div>
        <div class="corner-decoration bottom-right"></div>
        
        <div class="content">
            <div class="header">
                <div class="logo">
                    <img src="{{ public_path('images/logo.png') }}" alt="Logo">
                </div>
                <div class="medal">
                    <div class="year">{{ date('Y') }}</div>
                </div>
            </div>

            <div class="certificate-title">Certificate of Completion</div>

            <div class="recipient-name">{{ $user->first_name }} {{ $user->last_name }}</div>

            <div class="completion-text">
                has successfully completed the course
            </div>

            <div class="course-name">
                {{ $course->title }}
            </div>

            <div class="grade">with a grade of {{ $certificate->grade }}</div>

            <div class="skills-section">
                <div class="skills-title">Skills Earned</div>
                <div class="skills-list">
                    @foreach($certificate->skills as $skill)
                        <div class="skill-badge">{{ $skill }}</div>
                    @endforeach
                </div>
            </div>

            <div class="signatures">
                <div class="signature">
                    <div class="signature-line"></div>
                    <div class="signature-name">{{ $instructor->full_name }}</div>
                    <div class="signature-title">Course Instructor</div>
                </div>
                <div class="signature">
                    <div class="signature-line"></div>
                    <div class="signature-name">John Doe</div>
                    <div class="signature-title">Director of Education</div>
                </div>
            </div>

            <div class="certificate-footer">
                <div class="qr-section">
                    <div class="qr-code">
                        {!! $qrCode !!}
                    </div>
                    <div class="credential-id">Certificate ID: {{ $certificate->credential_id }}</div>
                </div>
                <div class="issue-date">
                    Issued on {{ $certificate->issue_date->format('F d, Y') }}
                </div>
            </div>
        </div>
    </div>
</body>
</html> 
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            margin: 0;
            padding: 0;
            background-color: #f7fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 32px;
            margin-bottom: 24px;
        }
        .header {
            text-align: center;
            margin-bottom: 32px;
        }
        .business-name {
            color: rgb({{ implode(',', sscanf($invoice->theme_color ?? '#0000FF', "#%02x%02x%02x")) }});
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .invoice-badge {
            display: inline-block;
            background-color: rgb({{ implode(',', sscanf($invoice->theme_color ?? '#0000FF', "#%02x%02x%02x")) }});
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            margin-top: 12px;
        }
        .amount-section {
            text-align: center;
            margin: 32px 0;
            padding: 24px;
            background-color: #f8fafc;
            border-radius: 8px;
        }
        .amount {
            font-size: 32px;
            font-weight: bold;
            color: rgb({{ implode(',', sscanf($invoice->theme_color ?? '#0000FF', "#%02x%02x%02x")) }});
            margin: 8px 0;
        }
        .due-date {
            color: #64748b;
            font-size: 14px;
        }
        .info-section {
            margin: 24px 0;
            padding: 0 16px;
        }
        .info-label {
            color: #64748b;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }
        .info-value {
            color: #1a202c;
            margin-bottom: 16px;
        }
        .notes {
            background-color: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            margin: 24px 0;
        }
        .footer {
            text-align: center;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
        }
        .contact-info {
            display: inline-block;
            margin: 8px 16px;
        }
        .button {
            display: inline-block;
            background-color: rgb({{ implode(',', sscanf($invoice->theme_color ?? '#0000FF', "#%02x%02x%02x")) }});
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            margin-top: 24px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="business-name">{{ $invoice->business->business_name }}</div>
                <div class="invoice-badge">Invoice #{{ $invoice->invoice_number }}</div>
            </div>

            <div class="amount-section">
                <div class="info-label">Amount Due</div>
                <div class="amount">{{ number_format($invoice->amount, 2) }} {{ $invoice->currency }}</div>
                <div class="due-date">Due by {{ $invoice->due_date->format('F j, Y') }}</div>
            </div>

            <div class="info-section">
                <div class="info-label">Billed To</div>
                <div class="info-value">
                    {{ $invoice->customer->name }}<br>
                    {{ $invoice->customer->email }}<br>
                    @if($invoice->customer->phone)
                        {{ $invoice->customer->phone }}<br>
                    @endif
                    @if($invoice->customer->address)
                        {{ $invoice->customer->address }}
                    @endif
                </div>

                @if($invoice->notes)
                <div class="notes">
                    <div class="info-label">Notes</div>
                    <div class="info-value">{{ $invoice->notes }}</div>
                </div>
                @endif
            </div>

            <div style="text-align: center;">
                <p>Please find your invoice attached to this email.</p>
                <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>
        </div>

        <div class="footer">
            <div class="contact-info">
                <strong>{{ $invoice->business->business_name }}</strong><br>
                {{ $invoice->business->address }}
            </div>
            <div class="contact-info">
                Email: {{ $invoice->business->business_email }}<br>
                Phone: {{ $invoice->business->phone_number }}
            </div>
        </div>
    </div>
</body>
</html> 
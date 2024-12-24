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
        .check-icon {
            width: 64px;
            height: 64px;
            background-color: rgb({{ implode(',', sscanf($invoice->theme_color ?? '#0000FF', "#%02x%02x%02x")) }});
            border-radius: 50%;
            margin: 0 auto 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
        }
        .amount {
            font-size: 32px;
            font-weight: bold;
            color: rgb({{ implode(',', sscanf($invoice->theme_color ?? '#0000FF', "#%02x%02x%02x")) }});
            margin: 16px 0;
            text-align: center;
        }
        .details {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
        }
        .row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
        }
        .label {
            color: #64748b;
        }
        .footer {
            text-align: center;
            color: #64748b;
            font-size: 14px;
            margin-top: 32px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="check-icon">✓</div>
                <h2>Payment Received</h2>
                <p>Thank you for your payment!</p>
            </div>

            <div class="amount">
                {{ number_format($payment->amount, 2) }} {{ $invoice->currency }}
            </div>

            <div class="details">
                <div class="row">
                    <span class="label">Invoice Number:</span>
                    <span>#{{ $invoice->invoice_number }}</span>
                </div>
                <div class="row">
                    <span class="label">Payment Date:</span>
                    <span>{{ $payment->payment_date->format('F j, Y') }}</span>
                </div>
                <div class="row">
                    <span class="label">Payment Method:</span>
                    <span>{{ ucfirst($payment->payment_method) }}</span>
                </div>
            </div>

            <p>Your payment has been successfully recorded. Please find your receipt attached to this email.</p>

            @if($invoice->amount > $invoice->paid_amount)
            <p>Remaining balance: {{ number_format($invoice->amount - $invoice->paid_amount, 2) }} {{ $invoice->currency }}</p>
            @endif
        </div>

        <div class="footer">
            {{ $invoice->business->business_name }}<br>
            {{ $invoice->business->phone_number }} | {{ $invoice->business->business_email }}
        </div>
    </div>
</body>
</html> 
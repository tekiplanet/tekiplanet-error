<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            margin-bottom: 30px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 0.9em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Invoice from {{ $invoice->business->business_name }}</h2>
        </div>

        <p>Dear {{ $invoice->customer->name }},</p>

        <p>Please find attached the invoice #{{ $invoice->invoice_number }} for {{ number_format($invoice->amount, 2) }} {{ $invoice->currency }}.</p>

        <p><strong>Due Date:</strong> {{ $invoice->due_date->format('F j, Y') }}</p>

        @if($invoice->notes)
        <p><strong>Notes:</strong><br>
        {{ $invoice->notes }}</p>
        @endif

        <p>If you have any questions, please don't hesitate to contact us.</p>

        <div class="footer">
            <p>
                {{ $invoice->business->business_name }}<br>
                {{ $invoice->business->address }}<br>
                Email: {{ $invoice->business->business_email }}<br>
                Phone: {{ $invoice->business->phone_number }}
            </p>
        </div>
    </div>
</body>
</html> 
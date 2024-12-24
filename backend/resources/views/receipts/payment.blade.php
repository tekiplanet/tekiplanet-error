<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {
            size: 80mm 150mm;
            margin: 0;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #333;
            margin: 10px;
        }
        .header {
            text-align: center;
            margin-bottom: 15px;
            color: rgb({{ implode(',', sscanf($invoice->theme_color ?? '#0000FF', "#%02x%02x%02x")) }});
        }
        .divider {
            border-top: 1px dashed #ccc;
            margin: 10px 0;
        }
        .row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
        }
        .label {
            color: #666;
        }
        .amount {
            font-weight: bold;
            color: rgb({{ implode(',', sscanf($invoice->theme_color ?? '#0000FF', "#%02x%02x%02x")) }});
        }
        .footer {
            text-align: center;
            font-size: 9px;
            color: #666;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2 style="margin: 0;">{{ $invoice->business->business_name }}</h2>
        <div>Payment Receipt</div>
    </div>

    <div class="divider"></div>

    <div class="row">
        <span class="label">Receipt No:</span>
        <span>{{ $payment->id }}</span>
    </div>
    <div class="row">
        <span class="label">Date:</span>
        <span>{{ $payment->payment_date->format('d M Y H:i') }}</span>
    </div>
    <div class="row">
        <span class="label">Invoice No:</span>
        <span>#{{ $invoice->invoice_number }}</span>
    </div>

    <div class="divider"></div>

    <div class="row">
        <span class="label">Received From:</span>
        <span>{{ $invoice->customer->name }}</span>
    </div>
    <div class="row">
        <span class="label">Amount Paid:</span>
        <span class="amount">{{ number_format($payment->amount, 2) }} {{ $invoice->currency }}</span>
    </div>
    <div class="row">
        <span class="label">Payment Method:</span>
        <span>{{ ucfirst($payment->payment_method) }}</span>
    </div>

    <div class="divider"></div>

    <div class="row">
        <span class="label">Invoice Total:</span>
        <span>{{ number_format($invoice->amount, 2) }} {{ $invoice->currency }}</span>
    </div>
    <div class="row">
        <span class="label">Amount Paid:</span>
        <span>{{ number_format($invoice->paid_amount, 2) }} {{ $invoice->currency }}</span>
    </div>
    <div class="row">
        <span class="label">Balance:</span>
        <span>{{ number_format($invoice->amount - $invoice->paid_amount, 2) }} {{ $invoice->currency }}</span>
    </div>

    <div class="footer">
        Thank you for your payment!<br>
        {{ $invoice->business->business_name }}<br>
        {{ $invoice->business->phone_number }} | {{ $invoice->business->business_email }}
    </div>
</body>
</html> 
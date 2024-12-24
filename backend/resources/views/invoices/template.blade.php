@php
$themeColor = $invoice->theme_color ?? '#0000FF';
$rgb = sscanf($themeColor, "#%02x%02x%02x");
if (!$rgb) {
    $rgb = [0, 0, 255]; // default blue if theme color is invalid
}
@endphp

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #333;
            line-height: 1.6;
        }
        .header { 
            color: rgb({{ implode(',', $rgb) }}); 
        }
        .status { 
            padding: 5px 10px;
            color: white;
            background-color: rgb({{ implode(',', $rgb) }});
            display: inline-block;
            border-radius: 4px;
        }
        .total-section {
            background-color: rgba({{ implode(',', $rgb) }}, 0.95);
            color: white;
            padding: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 10px;
            border: 1px solid #ddd;
        }
        th {
            background-color: rgb({{ implode(',', $rgb) }});
            color: white;
        }
    </style>
</head>
<body>
    <h1 class="header">INVOICE</h1>
    
    <div style="margin-bottom: 20px;">
        <strong style="color: rgb({{ implode(',', $rgb) }});">
            {{ $invoice->business->business_name }}
        </strong><br>
        {{ $invoice->business->address }}<br>
        Email: {{ $invoice->business->business_email }}<br>
        Phone: {{ $invoice->business->phone_number }}
    </div>

    <div style="margin-bottom: 20px;">
        <table width="100%">
            <tr>
                <td width="60%">
                    <strong>Invoice #:</strong> {{ $invoice->invoice_number }}<br>
                    <strong>Date:</strong> {{ $invoice->created_at->format('Y-m-d') }}<br>
                    <strong>Due Date:</strong> {{ $invoice->due_date->format('Y-m-d') }}
                </td>
                <td width="40%" align="right">
                    <div class="status">{{ strtoupper($invoice->getStatusDetails()['label']) }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div style="margin-bottom: 20px;">
        <strong>Bill To:</strong><br>
        {{ $invoice->customer->name }}<br>
        {{ $invoice->customer->address }}<br>
        Email: {{ $invoice->customer->email }}<br>
        Phone: {{ $invoice->customer->phone }}
    </div>

    <table>
        <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Amount</th>
        </tr>
        @foreach($invoice->items as $item)
        <tr>
            <td>{{ $item->description }}</td>
            <td align="center">{{ $item->quantity }}</td>
            <td align="right">{{ number_format($item->unit_price, 2) }} {{ $invoice->currency }}</td>
            <td align="right">{{ number_format($item->amount, 2) }} {{ $invoice->currency }}</td>
        </tr>
        @endforeach
        <tr class="total-section">
            <td colspan="3" align="right"><strong>Total:</strong></td>
            <td align="right"><strong>{{ number_format($invoice->amount, 2) }} {{ $invoice->currency }}</strong></td>
        </tr>
        @if($invoice->paid_amount > 0)
        <tr>
            <td colspan="3" align="right">Paid Amount:</td>
            <td align="right">{{ number_format($invoice->paid_amount, 2) }} {{ $invoice->currency }}</td>
        </tr>
        <tr>
            <td colspan="3" align="right"><strong>Balance Due:</strong></td>
            <td align="right"><strong>{{ number_format($invoice->amount - $invoice->paid_amount, 2) }} {{ $invoice->currency }}</strong></td>
        </tr>
        @endif
    </table>

    @if($invoice->notes)
    <div style="margin-top: 20px;">
        <strong style="color: rgb({{ implode(',', $rgb) }});">Notes:</strong><br>
        {{ $invoice->notes }}
    </div>
    @endif
</body>
</html> 
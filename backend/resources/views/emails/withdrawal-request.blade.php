@component('mail::message')
# Withdrawal Request Received

Dear {{ $transaction->user->first_name }},

Your withdrawal request has been received and is being processed. Here are the details:

**Amount:** {{ $formattedAmount }}  
**Bank:** {{ $bankAccount->bank_name }}  
**Account Number:** {{ $bankAccount->account_number }}  
**Reference:** {{ $transaction->reference_number }}

Your request will be processed within 24 hours. We'll notify you once the transfer is completed.

@component('mail::button', ['url' => config('app.frontend_url').'/dashboard/wallet/transactions/'.$transaction->id])
View Transaction
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent 
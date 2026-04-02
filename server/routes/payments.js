import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

// =============================================
// STUDENT ENDPOINTS — Submit & track payments
// =============================================

// GET /api/payments/school-methods — Get school's payment options
router.get('/school-methods', authMiddleware, (req, res) => {
  const schoolId = req.user.school_id;
  const configs = db.school_payment_config.filter(c => c.school_id === schoolId && c.is_active);
  const school = db.schools.find(s => s.id === schoolId);

  res.json({
    school_name: school?.name,
    methods: configs.map(c => ({
      id: c.id,
      method_type: c.method_type,
      label: c.label,
      is_primary: c.is_primary,
      // UPI details
      upi_id: c.upi_id || null,
      qr_image: c.qr_image || null,
      // Bank details
      bank_name: c.bank_name || null,
      account_number: c.account_number || null,
      ifsc_code: c.ifsc_code || null,
      account_holder: c.account_holder || null,
      branch: c.branch || null,
      // Cash/Cheque
      instructions: c.instructions || null,
      cheque_payable_to: c.cheque_payable_to || null,
    })),
  });
});

// POST /api/payments/submit — Student submits a payment for verification
router.post('/submit', authMiddleware, (req, res) => {
  const { fee_structure_id, amount, payment_method_id, transaction_id, payment_proof_note } = req.body;
  const studentId = req.user.student_id;
  const schoolId = req.user.school_id;

  if (!fee_structure_id || !amount || !payment_method_id) {
    return res.status(400).json({ error: 'fee_structure_id, amount, and payment_method_id required' });
  }

  const fee = db.fees_structure.find(f => f.id === fee_structure_id);
  if (!fee) return res.status(404).json({ error: 'Fee structure not found' });

  const paymentMethod = db.school_payment_config.find(c => c.id === payment_method_id);
  if (!paymentMethod) return res.status(404).json({ error: 'Payment method not found' });

  const student = db.students.find(s => s.id === studentId);

  const request = {
    id: uuidv4(),
    student_id: studentId,
    school_id: schoolId,
    fee_structure_id,
    payment_config_id: payment_method_id,
    amount: Number(amount),
    transaction_id: transaction_id || null,
    payment_proof_note: payment_proof_note || null,
    payment_method_type: paymentMethod.method_type,
    payment_method_label: paymentMethod.label,
    fee_name: fee.name,
    student_name: student?.name,
    student_roll: student?.roll_number,
    status: 'pending',  // pending → approved / rejected
    submitted_at: new Date().toISOString(),
    reviewed_at: null,
    reviewed_by: null,
    reject_reason: null,
    receipt_no: null,
  };

  db.payment_requests.push(request);

  res.json({
    success: true,
    request,
    message: 'Payment submitted for verification. You will receive a receipt once approved.',
  });
});

// GET /api/payments/my-requests — Student's payment requests
router.get('/my-requests', authMiddleware, (req, res) => {
  const requests = db.payment_requests
    .filter(r => r.student_id === req.user.student_id)
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  res.json(requests);
});

// =============================================
// ADMIN ENDPOINTS — Verify payments, manage config
// =============================================

// GET /api/payments/admin/pending — Get pending payment requests
router.get('/admin/pending', authMiddleware, roleMiddleware(['school_admin']), (req, res) => {
  const requests = db.payment_requests
    .filter(r => r.school_id === req.user.school_id && r.status === 'pending')
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  res.json(requests);
});

// GET /api/payments/admin/all — Get all payment requests
router.get('/admin/all', authMiddleware, roleMiddleware(['school_admin']), (req, res) => {
  const requests = db.payment_requests
    .filter(r => r.school_id === req.user.school_id)
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  res.json(requests);
});

// PUT /api/payments/admin/verify/:id — Approve or reject a payment
router.put('/admin/verify/:id', authMiddleware, roleMiddleware(['school_admin']), (req, res) => {
  const { status, reject_reason } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
  }

  const request = db.payment_requests.find(r => r.id === req.params.id && r.school_id === req.user.school_id);
  if (!request) return res.status(404).json({ error: 'Payment request not found' });

  request.status = status;
  request.reviewed_at = new Date().toISOString();
  request.reviewed_by = req.user.name;

  if (status === 'rejected') {
    request.reject_reason = reject_reason || 'Payment could not be verified';
  }

  if (status === 'approved') {
    // Create official fee payment record
    const receiptNo = `REC-${Date.now()}`;
    request.receipt_no = receiptNo;

    db.fee_payments.push({
      id: uuidv4(),
      student_id: request.student_id,
      school_id: request.school_id,
      fee_structure_id: request.fee_structure_id,
      amount: request.amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: request.payment_method_type,
      status: 'paid',
      receipt_no: receiptNo,
      month: new Date().toISOString().substring(0, 7),
      transaction_id: request.transaction_id,
      payment_request_id: request.id,
    });
  }

  res.json({ success: true, request, message: `Payment ${status}` });
});

// GET /api/payments/admin/config — Get school's payment method config
router.get('/admin/config', authMiddleware, roleMiddleware(['school_admin']), (req, res) => {
  const configs = db.school_payment_config.filter(c => c.school_id === req.user.school_id);
  res.json(configs);
});

// POST /api/payments/admin/config — Add new payment method
router.post('/admin/config', authMiddleware, roleMiddleware(['school_admin']), (req, res) => {
  const { method_type, label, upi_id, bank_name, account_number, ifsc_code,
          account_holder, branch, instructions, cheque_payable_to, is_primary } = req.body;

  if (!method_type || !label) {
    return res.status(400).json({ error: 'method_type and label are required' });
  }

  const config = {
    id: uuidv4(),
    school_id: req.user.school_id,
    method_type,
    label,
    upi_id: upi_id || null,
    bank_name: bank_name || null,
    account_number: account_number || null,
    ifsc_code: ifsc_code || null,
    account_holder: account_holder || null,
    branch: branch || null,
    instructions: instructions || null,
    cheque_payable_to: cheque_payable_to || null,
    qr_image: null,
    is_primary: is_primary || false,
    is_active: true,
  };

  db.school_payment_config.push(config);
  res.json({ success: true, config });
});

// PUT /api/payments/admin/config/:id — Update payment method
router.put('/admin/config/:id', authMiddleware, roleMiddleware(['school_admin']), (req, res) => {
  const config = db.school_payment_config.find(c => c.id === req.params.id && c.school_id === req.user.school_id);
  if (!config) return res.status(404).json({ error: 'Config not found' });

  Object.keys(req.body).forEach(key => {
    if (key !== 'id' && key !== 'school_id') config[key] = req.body[key];
  });

  res.json({ success: true, config });
});

// DELETE /api/payments/admin/config/:id — Deactivate payment method
router.delete('/admin/config/:id', authMiddleware, roleMiddleware(['school_admin']), (req, res) => {
  const config = db.school_payment_config.find(c => c.id === req.params.id && c.school_id === req.user.school_id);
  if (!config) return res.status(404).json({ error: 'Config not found' });

  config.is_active = false;
  res.json({ success: true, message: 'Payment method deactivated' });
});

export default router;

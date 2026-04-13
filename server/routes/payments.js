import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

// =============================================
// STUDENT ENDPOINTS — Submit & track payments
// =============================================

// GET /api/payments/school-methods — Get school's active payment options
router.get('/school-methods', authMiddleware, async (req, res) => {
  try {
    const schoolId = req.user.school_id;

    const [configs] = await db.query(
      'SELECT * FROM school_payment_config WHERE school_id = ? AND is_active = 1',
      [schoolId]
    );
    const [[school]] = await db.query(
      'SELECT name FROM schools WHERE id = ?',
      [schoolId]
    );

    res.json({
      school_name: school?.name,
      methods: configs.map(c => ({
        id:                 c.id,
        method_type:        c.method_type,
        label:              c.label,
        is_primary:         c.is_primary,
        upi_id:             c.upi_id || null,
        qr_image:           c.qr_image || null,
        bank_name:          c.bank_name || null,
        account_number:     c.account_number || null,
        ifsc_code:          c.ifsc_code || null,
        account_holder:     c.account_holder || null,
        branch:             c.branch || null,
        instructions:       c.instructions || null,
        cheque_payable_to:  c.cheque_payable_to || null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/payments/submit — Student submits a payment for verification
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { fee_structure_id, amount, payment_method_id, transaction_id, payment_proof_note } = req.body;
    const studentId = req.user.student_id;
    const schoolId  = req.user.school_id;

    if (!fee_structure_id || !amount || !payment_method_id) {
      return res.status(400).json({ error: 'fee_structure_id, amount, and payment_method_id required' });
    }

    const [[fee]] = await db.query('SELECT * FROM fees_structure WHERE id = ?', [fee_structure_id]);
    if (!fee) return res.status(404).json({ error: 'Fee structure not found' });

    const [[paymentMethod]] = await db.query(
      'SELECT * FROM school_payment_config WHERE id = ?',
      [payment_method_id]
    );
    if (!paymentMethod) return res.status(404).json({ error: 'Payment method not found' });

    const [[student]] = await db.query(
      'SELECT name, roll_number FROM students WHERE id = ?',
      [studentId]
    );

    const id = uuidv4();
    await db.query(
      `INSERT INTO payment_requests
         (id,student_id,school_id,fee_structure_id,payment_config_id,amount,
          transaction_id,payment_proof_note,payment_method_type,payment_method_label,
          fee_name,student_name,student_roll,status,submitted_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',NOW())`,
      [
        id, studentId, schoolId, fee_structure_id, payment_method_id, Number(amount),
        transaction_id || null, payment_proof_note || null,
        paymentMethod.method_type, paymentMethod.label,
        fee.name, student?.name || null, student?.roll_number || null,
      ]
    );

    const [[request]] = await db.query('SELECT * FROM payment_requests WHERE id = ?', [id]);

    res.json({
      success: true,
      request,
      message: 'Payment submitted for verification. You will receive a receipt once approved.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/payments/my-requests — Student's payment requests
router.get('/my-requests', authMiddleware, async (req, res) => {
  try {
    const [requests] = await db.query(
      'SELECT * FROM payment_requests WHERE student_id = ? ORDER BY submitted_at DESC',
      [req.user.student_id]
    );
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =============================================
// ADMIN ENDPOINTS — Verify payments, manage config
// =============================================

// GET /api/payments/admin/pending — Get pending payment requests
router.get('/admin/pending', authMiddleware, roleMiddleware(['school_admin']), async (req, res) => {
  try {
    const [requests] = await db.query(
      `SELECT * FROM payment_requests
       WHERE school_id = ? AND status = 'pending'
       ORDER BY submitted_at DESC`,
      [req.user.school_id]
    );
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/payments/admin/all — Get all payment requests
router.get('/admin/all', authMiddleware, roleMiddleware(['school_admin']), async (req, res) => {
  try {
    const [requests] = await db.query(
      'SELECT * FROM payment_requests WHERE school_id = ? ORDER BY submitted_at DESC',
      [req.user.school_id]
    );
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/payments/admin/verify/:id — Approve or reject a payment
router.put('/admin/verify/:id', authMiddleware, roleMiddleware(['school_admin']), async (req, res) => {
  try {
    const { status, reject_reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
    }

    const [[request]] = await db.query(
      'SELECT * FROM payment_requests WHERE id = ? AND school_id = ?',
      [req.params.id, req.user.school_id]
    );
    if (!request) return res.status(404).json({ error: 'Payment request not found' });

    let receiptNo = null;

    if (status === 'approved') {
      receiptNo = `REC-${Date.now()}`;
      const today = new Date().toISOString().split('T')[0];
      const month = new Date().toISOString().substring(0, 7);

      await db.query(
        `INSERT INTO fee_payments
           (id,student_id,school_id,fee_structure_id,amount,payment_date,payment_method,
            status,receipt_no,month,transaction_id,payment_request_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          uuidv4(), request.student_id, request.school_id, request.fee_structure_id,
          request.amount, today, request.payment_method_type,
          'paid', receiptNo, month, request.transaction_id || null, request.id,
        ]
      );
    }

    await db.query(
      `UPDATE payment_requests
       SET status=?, reviewed_at=NOW(), reviewed_by=?,
           reject_reason=?, receipt_no=?
       WHERE id=?`,
      [
        status, req.user.name,
        status === 'rejected' ? (reject_reason || 'Payment could not be verified') : null,
        receiptNo,
        req.params.id,
      ]
    );

    const [[updated]] = await db.query('SELECT * FROM payment_requests WHERE id = ?', [req.params.id]);
    res.json({ success: true, request: updated, message: `Payment ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/payments/admin/config — Get school's payment method config
router.get('/admin/config', authMiddleware, roleMiddleware(['school_admin']), async (req, res) => {
  try {
    const [configs] = await db.query(
      'SELECT * FROM school_payment_config WHERE school_id = ? ORDER BY is_primary DESC, id',
      [req.user.school_id]
    );
    res.json(configs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/payments/admin/config — Add new payment method
router.post('/admin/config', authMiddleware, roleMiddleware(['school_admin']), async (req, res) => {
  try {
    const {
      method_type, label, upi_id, bank_name, account_number, ifsc_code,
      account_holder, branch, instructions, cheque_payable_to, is_primary,
    } = req.body;

    if (!method_type || !label) {
      return res.status(400).json({ error: 'method_type and label are required' });
    }

    const id = uuidv4();
    await db.query(
      `INSERT INTO school_payment_config
         (id,school_id,method_type,label,upi_id,bank_name,account_number,ifsc_code,
          account_holder,branch,instructions,cheque_payable_to,qr_image,is_primary,is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NULL,?,1)`,
      [
        id, req.user.school_id, method_type, label,
        upi_id||null, bank_name||null, account_number||null, ifsc_code||null,
        account_holder||null, branch||null, instructions||null, cheque_payable_to||null,
        is_primary ? 1 : 0,
      ]
    );

    const [[config]] = await db.query('SELECT * FROM school_payment_config WHERE id = ?', [id]);
    res.json({ success: true, config });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/payments/admin/config/:id — Update payment method
router.put('/admin/config/:id', authMiddleware, roleMiddleware(['school_admin']), async (req, res) => {
  try {
    const [[existing]] = await db.query(
      'SELECT id FROM school_payment_config WHERE id = ? AND school_id = ?',
      [req.params.id, req.user.school_id]
    );
    if (!existing) return res.status(404).json({ error: 'Config not found' });

    const allowed = ['method_type','label','upi_id','bank_name','account_number','ifsc_code',
                     'account_holder','branch','instructions','cheque_payable_to','is_primary','is_active'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

    if (Object.keys(updates).length > 0) {
      const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      await db.query(
        `UPDATE school_payment_config SET ${setClause} WHERE id = ?`,
        [...Object.values(updates), req.params.id]
      );
    }

    const [[config]] = await db.query('SELECT * FROM school_payment_config WHERE id = ?', [req.params.id]);
    res.json({ success: true, config });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/payments/admin/config/:id — Deactivate payment method
router.delete('/admin/config/:id', authMiddleware, roleMiddleware(['school_admin']), async (req, res) => {
  try {
    const [[existing]] = await db.query(
      'SELECT id FROM school_payment_config WHERE id = ? AND school_id = ?',
      [req.params.id, req.user.school_id]
    );
    if (!existing) return res.status(404).json({ error: 'Config not found' });

    await db.query(
      'UPDATE school_payment_config SET is_active = 0 WHERE id = ?',
      [req.params.id]
    );
    res.json({ success: true, message: 'Payment method deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

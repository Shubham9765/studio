'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';

export default function TermsAndConditionsPage() {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none">
            <p><strong>Last updated:</strong> {currentDate}</p>
            
            <p>
              Welcome to Village Eats! These Terms and Conditions outline the rules and regulations for the use of the Village Eats mobile application and website (collectively, the "Platform"). By accessing or using our Platform, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
            </p>

            <h2>1. Definitions</h2>
            <ul>
              <li><strong>"Company," "We," "Us," "Our"</strong> refers to Village Eats.</li>
              <li><strong>"Platform"</strong> refers to the Village Eats mobile application and website.</li>
              <li><strong>"User," "You," "Your"</strong> refers to any individual or entity who accesses or uses our Platform. This includes Customers, Restaurant Partners, and Delivery Partners.</li>
              <li><strong>"Restaurant Partner"</strong> refers to restaurants and food vendors listed on our Platform.</li>
              <li><strong>"Delivery Partner"</strong> refers to independent third-party contractors who provide delivery services.</li>
              <li><strong>"Service"</strong> includes browsing restaurants, placing orders, payment processing, and delivery facilitation provided through the Platform.</li>
            </ul>

            <h2>2. Service Overview & Eligibility</h2>
            <p>Village Eats is a technology platform that connects users with Restaurant Partners to order food for delivery. We are not a restaurant or food preparation entity.</p>
            <p>By using our Service, you represent that you are at least 18 years of age and legally capable of entering into binding contracts.</p>

            <h2>3. User Accounts</h2>
            <p>To use most features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process. You are solely responsible for all activities that occur under your account and for safeguarding your password. Village Eats shall not be liable for any loss or damage arising from your failure to comply with this requirement.</p>

            <h2>4. Orders, Payments, and Cancellations</h2>
            <h3>Placing Orders</h3>
            <p>When you place an order, you are making an offer to purchase food from a Restaurant Partner. The contract for the supply of food is between you and the Restaurant Partner. Order acceptance will be confirmed through a notification on the Platform.</p>
            <h3>Payments</h3>
            <p>You agree to pay the full price for all items in your order, including delivery fees and any applicable taxes. We facilitate payment through various methods such as Cash on Delivery (COD) and Unified Payments Interface (UPI). For UPI payments, you are responsible for providing accurate transaction details for verification.</p>
            <h3>Cancellations and Refunds</h3>
            <p>You may be able to cancel an order before it is accepted by the Restaurant Partner. Post-acceptance cancellation policies are at the discretion of the Restaurant Partner and Village Eats. Refunds, if any, will be processed according to our Refund Policy, which may be updated from time to time.</p>

            <h2>5. Delivery</h2>
            <p>Delivery times shown are estimates and are not guaranteed. Delivery is facilitated by Delivery Partners, who are responsible for the transportation of the food. You are responsible for providing an accurate delivery address and being available to receive the order.</p>

            <h2>6. User Conduct and Reviews</h2>
            <p>You agree not to use the Platform for any unlawful purpose. When you submit reviews or ratings, you grant Village Eats a perpetual, royalty-free, and irrevocable right to use, reproduce, and display such content. Reviews must be based on your genuine experience and must not contain offensive, defamatory, or misleading content.</p>

            <h2>7. Disclaimer of Warranties</h2>
            <p>The Service is provided "AS IS" and "AS AVAILABLE" without any warranties, express or implied. Village Eats does not prepare the food and does not guarantee the quality, safety, or fitness for a particular purpose of any food provided by Restaurant Partners. We do not guarantee that the Service will be uninterrupted, secure, or error-free.</p>

            <h2>8. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, Village Eats shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to, loss of profits, data, or goodwill, arising out of your use of the Platform or Service.</p>

            <h2>9. Indemnification</h2>
            <p>You agree to defend, indemnify, and hold harmless Village Eats, its officers, directors, employees, and agents, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees), resulting from or arising out of your use and access of the Service, or a breach of these Terms.</p>

            <h2>10. Termination</h2>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms. Upon termination, your right to use the Service will immediately cease.</p>

            <h2>11. Governing Law & Jurisdiction</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising out of these Terms will be subject to the exclusive jurisdiction of the courts located in India.</p>
            
            <h2>12. Changes to Terms</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms and Conditions on this page. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.</p>

            <h2>13. Contact Us</h2>
            <p>
              If you have any questions about these Terms and Conditions, you can contact us:
            </p>
            <ul>
              <li>By email: <strong>shubhamonlineinsta@gmail.com</strong></li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

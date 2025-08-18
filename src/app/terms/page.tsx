
'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';

export default function TermsAndConditionsPage() {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString());
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
            <p>Last updated: {currentDate}</p>
            <p>
              Please read these terms and conditions carefully before using Our
              Service.
            </p>

            <h2>Interpretation and Definitions</h2>
            <h3>Interpretation</h3>
            <p>
              The words of which the initial letter is capitalized have meanings
              defined under the following conditions. The following definitions
              shall have the same meaning regardless of whether they appear in
              singular or in plural.
            </p>
            <h3>Definitions</h3>
            <p>For the purposes of these Terms and Conditions:</p>
            <ul>
              <li>
                <strong>Application</strong> means the software program provided
                by the Company downloaded by You on any electronic device, named
                Village Eats.
              </li>
              <li>
                <strong>Company</strong> (referred to as either "the Company",
                "We", "Us" or "Our" in this Agreement) refers to Village Eats.
              </li>
              <li>
                <strong>Country</strong> refers to: India
              </li>
              <li>
                <strong>Service</strong> refers to the Application.
              </li>
              <li>
                <strong>Terms and Conditions</strong> (also referred as "Terms")
                mean these Terms and Conditions that form the entire agreement
                between You and the Company regarding the use of the Service.
              </li>
              <li>
                <strong>You</strong> means the individual accessing or using the
                Service, or the company, or other legal entity on behalf of
                which such individual is accessing or using the Service, as
                applicable.
              </li>
            </ul>

            <h2>Acknowledgment</h2>
            <p>
              These are the Terms and Conditions governing the use of this
              Service and the agreement that operates between You and the
              Company. These Terms and Conditions set out the rights and
              obligations of all users regarding the use of the Service.
            </p>
            <p>
              Your access to and use of the Service is conditioned on Your
              acceptance of and compliance with these Terms and Conditions. These
              Terms and Conditions apply to all visitors, users and others who
              access or use the Service.
            </p>
            <p>
              By accessing or using the Service You agree to be bound by these
              Terms and Conditions. If You disagree with any part of these Terms
              and Conditions then You may not access the Service.
            </p>

            <h2>Placing Orders for Goods</h2>
            <p>
              By placing an Order for Goods through the Service, You warrant that
              You are legally capable of entering into binding contracts.
            </p>

            <h2>User Accounts</h2>
            <p>
              When You create an account with Us, You must provide Us information
              that is accurate, complete, and current at all times. Failure to do
              so constitutes a breach of the Terms, which may result in
              immediate termination of Your account on Our Service.
            </p>
            <p>
              You are responsible for safeguarding the password that You use to
              access the Service and for any activities or actions under Your
              password, whether Your password is with Our Service or a
              Third-Party Social Media Service.
            </p>

            <h2>Termination</h2>
            <p>
              We may terminate or suspend Your account immediately, without prior
              notice or liability, for any reason whatsoever, including without
              limitation if You breach these Terms and Conditions.
            </p>
            <p>
              Upon termination, Your right to use the Service will cease
              immediately. If You wish to terminate Your account, You may simply
              discontinue using the Service.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, in no event
              shall the Company or its suppliers be liable for any special,
              incidental, indirect, or consequential damages whatsoever...
            </p>

            <h2>"AS IS" and "AS AVAILABLE" Disclaimer</h2>
            <p>
              The Service is provided to You "AS IS" and "AS AVAILABLE" and with
              all faults and defects without warranty of any kind...
            </p>
            
            <h2>Contact Us</h2>
            <p>
              If you have any questions about these Terms and Conditions, You can
              contact us:
            </p>
            <ul>
              <li>By email: shubhamonlineinsta@gmail.com</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

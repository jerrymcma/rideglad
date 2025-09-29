export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              Ride Constellation collects information to provide our ride-sharing services effectively and safely:
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Name, email address, and profile information</li>
              <li>Phone number for communication with drivers</li>
              <li>Payment information (credit card details)</li>
              <li>Profile photos and user preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Location Information</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Precise location data for pickup and drop-off</li>
              <li>Real-time location during active rides</li>
              <li>GPS tracking for route optimization and safety</li>
              <li>Location history for trip records</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Trip and Usage Data</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Trip history, routes, and destinations</li>
              <li>Driver and rider ratings and feedback</li>
              <li>App usage patterns and preferences</li>
              <li>Communication between riders and drivers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Facilitate ride bookings and driver matching</li>
              <li>Process payments securely through Stripe</li>
              <li>Provide real-time GPS navigation and tracking</li>
              <li>Enable communication between riders and drivers</li>
              <li>Maintain safety and security of our platform</li>
              <li>Improve our services and user experience</li>
              <li>Send important updates about your rides</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
            <p className="mb-4">We share your information only when necessary:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>With Drivers:</strong> We share your pickup location, destination, and contact information with matched drivers</li>
              <li><strong>With Riders:</strong> Drivers can see rider pickup locations and basic profile information</li>
              <li><strong>Service Providers:</strong> We use trusted third parties like Stripe (payments), Google Maps (navigation), and Replit (authentication)</li>
              <li><strong>Legal Requirements:</strong> We may disclose information when required by law or to protect safety</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Services</h2>
            <p className="mb-4">Our app integrates with the following third-party services:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Google Maps:</strong> For navigation, location services, and mapping</li>
              <li><strong>Stripe:</strong> For secure payment processing</li>
              <li><strong>Replit:</strong> For user authentication and account management</li>
              <li><strong>WebSocket services:</strong> For real-time communication and updates</li>
            </ul>
            <p className="text-gray-600">
              These services have their own privacy policies. We encourage you to review them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="mb-4">We implement industry-standard security measures:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Encrypted data transmission (HTTPS/SSL)</li>
              <li>Secure payment processing through Stripe</li>
              <li>Protected database storage with access controls</li>
              <li>Regular security monitoring and updates</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Account Access:</strong> You can view and update your profile information</li>
              <li><strong>Location Settings:</strong> You can control location permissions through your device settings</li>
              <li><strong>Data Deletion:</strong> Contact us to request deletion of your account and data</li>
              <li><strong>Communication Preferences:</strong> Opt out of non-essential notifications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Children's Privacy</h2>
            <p className="mb-4">
              Ride Constellation is not intended for children under 13. We do not knowingly collect 
              personal information from children under 13. If we learn that we have collected 
              personal information from a child under 13, we will delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
            <p className="mb-4">
              We retain your information for as long as necessary to provide our services and comply 
              with legal obligations. Trip data is typically retained for safety and regulatory purposes. 
              You may request deletion of your account and associated data at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
            <p className="mb-4">
              We may update this privacy policy from time to time. We will notify users of significant 
              changes through the app or by email. Your continued use of our services after changes 
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
            <p className="mb-4">
              If you have questions about this privacy policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Ride Constellation</strong></p>
              <p>Email: privacy@rideconstellation.com</p>
              <p>For data deletion requests or privacy concerns</p>
            </div>
          </section>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-500">
            This privacy policy is effective as of {new Date().toLocaleDateString()} and applies to all users of the Ride Constellation mobile application.
          </p>
        </div>
      </div>
    </div>
  );
}
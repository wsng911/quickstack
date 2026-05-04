import k3s from "../../adapter/kubernetes-api.adapter";

const traefik名称space = 'kube-system';

class IngressSetupService {

    async checkIfTraefikRedirectMiddlewareExists() {
        const res = await k3s.customObjects.list名称spacedCustomObject(
            'traefik.io',            // group
            'v1alpha1',              // version
            traefik名称space,        // namespace
            'middlewares'            // plural name of the custom resource
        );
        return (res.body as any) && (res.body as any)?.items && (res.body as any)?.items?.length > 0;
    }

    async createTraefikRedirectMiddlewareIfNotExist() {
        if (await this.checkIfTraefikRedirectMiddlewareExists()) {
            return;
        }

        const middlewareManifest = {
            apiVersion: 'traefik.io/v1alpha1',
            kind: 'Middleware',
            metadata: {
                name: 'redirect-to-https',
                namespace: traefik名称space,
            },
            spec: {
                redirectScheme: {
                    scheme: 'https',
                    permanent: true,
                }
            },
        };

        await k3s.customObjects.create名称spacedCustomObject(
            'traefik.io',           // group
            'v1alpha1',             // version
            traefik名称space,       // namespace
            'middlewares',          // plural name of the custom resource
            middlewareManifest      // object manifest
        );
    }
}

const ingressSetupService = new IngressSetupService();
export default ingressSetupService;
